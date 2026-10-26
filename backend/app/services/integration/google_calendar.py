import asyncio
import logging
import re
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import httpx

from app.core.config import settings
from app.core.crypto import decrypt_key, encrypt_key
from app.core.database import get_database

logger = logging.getLogger(__name__)
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
CALENDAR_API = "https://www.googleapis.com/calendar/v3"
GOOGLE_SCOPES = (
    "openid email "
    "https://www.googleapis.com/auth/calendar.events "
    "https://www.googleapis.com/auth/meetings.space.readonly"
)
GOOGLE_DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file"
WEEKDAYS = ("MO", "TU", "WE", "TH", "FR", "SA", "SU")


def google_calendar_configured() -> bool:
    return bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET)


def google_authorization_url(state: str, redirect_uri: Optional[str] = None, include_drive: bool = False) -> str:
    from urllib.parse import urlencode

    scopes = GOOGLE_SCOPES + (f" {GOOGLE_DRIVE_FILE_SCOPE}" if include_drive else "")
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": redirect_uri or settings.google_calendar_redirect,
        "response_type": "code",
        "scope": scopes,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
        "state": state,
    })


async def exchange_code(code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(GOOGLE_TOKEN_URL, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri or settings.google_calendar_redirect,
            "grant_type": "authorization_code",
        })
    if response.status_code != 200:
        logger.warning("Google Calendar token exchange rejected (%s)", response.status_code)
        raise ValueError("Google authorization could not be completed. Retry connecting your calendar.")
    return response.json()


async def google_account_email(access_token_value: str) -> Optional[str]:
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {access_token_value}"},
        )
    if response.status_code != 200:
        logger.warning("Could not read Google account identity (%s)", response.status_code)
        return None
    return response.json().get("email")


def _decrypt_connection(connection: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(connection)
    for key in ("access_token", "refresh_token"):
        if result.get(key):
            result[key] = decrypt_key(str(result[key]))
    return result


async def save_connection(org_id: str, user_id: str, token_data: Dict[str, Any]) -> None:
    db = get_database()
    now = datetime.utcnow()
    old = await get_connection(org_id, user_id)
    refresh_token = token_data.get("refresh_token") or (old or {}).get("refresh_token")
    if not refresh_token:
        raise ValueError("Google did not return a refresh token. Reconnect and approve calendar access.")
    expires_at = now + timedelta(seconds=int(token_data.get("expires_in", 3600)))
    payload = {
        "org_id": str(org_id),
        "user_id": str(user_id),
        "access_token": encrypt_key(token_data["access_token"]),
        "refresh_token": encrypt_key(refresh_token),
        "expires_at": expires_at,
        "scope": token_data.get("scope", GOOGLE_SCOPES),
        "connected_at": (old or {}).get("connected_at", now),
        "updated_at": now,
    }
    await db["google_calendar_connections"].update_one(
        {"org_id": str(org_id), "user_id": str(user_id)}, {"$set": payload}, upsert=True
    )


async def get_connection(org_id: str, user_id: str) -> Optional[Dict[str, Any]]:
    db = get_database()
    if db is None:
        return None
    raw = await db["google_calendar_connections"].find_one({"org_id": str(org_id), "user_id": str(user_id)})
    if not raw:
        return None
    raw.pop("_id", None)
    return _decrypt_connection(raw)


async def disconnect(org_id: str, user_id: str) -> None:
    db = get_database()
    await db["google_calendar_connections"].delete_one({"org_id": str(org_id), "user_id": str(user_id)})


async def access_token(org_id: str, user_id: str) -> str:
    connection = await get_connection(org_id, user_id)
    if not connection:
        raise ValueError("Connect a Google Calendar account before scheduling team standups")
    expires_at = connection.get("expires_at")
    if expires_at and expires_at > datetime.utcnow() + timedelta(minutes=2):
        return connection["access_token"]
    if not connection.get("refresh_token"):
        raise ValueError("Google Calendar connection expired. Reconnect your account.")
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": connection["refresh_token"],
            "grant_type": "refresh_token",
        })
    if response.status_code != 200 or not response.json().get("access_token"):
        await disconnect(org_id, user_id)
        raise ValueError("Google Calendar authorization expired. Reconnect your account.")
    tokens = response.json()
    refreshed = {
        "access_token": encrypt_key(tokens["access_token"]),
        "refresh_token": encrypt_key(connection["refresh_token"]),
        "expires_at": datetime.utcnow() + timedelta(seconds=int(tokens.get("expires_in", 3600))),
        "updated_at": datetime.utcnow(),
    }
    if tokens.get("refresh_token"):
        refreshed["refresh_token"] = encrypt_key(tokens["refresh_token"])
    await get_database()["google_calendar_connections"].update_one(
        {"org_id": str(org_id), "user_id": str(user_id)}, {"$set": refreshed}
    )
    return tokens["access_token"]


def _next_local_start(local_time: str, timezone_name: str, weekdays: List[int]) -> datetime:
    zone = ZoneInfo(timezone_name)
    parsed_time = datetime.strptime(local_time, "%H:%M").time()
    now = datetime.now(zone)
    for days_ahead in range(0, 8):
        day = now.date() + timedelta(days=days_ahead)
        candidate = datetime.combine(day, parsed_time, tzinfo=zone)
        if day.weekday() in weekdays and candidate > now + timedelta(minutes=2):
            return candidate
    raise ValueError("Choose at least one valid weekday")


async def create_recurring_standup(
    *, org_id: str, organizer_id: str, team_id: str, team_name: str,
    member_emails: List[str], weekdays: List[int], local_time: str,
    duration_minutes: int, timezone_name: str,
):
    if not weekdays or any(day not in range(7) for day in weekdays):
        raise ValueError("Select one or more weekdays for the standup")
    try:
        ZoneInfo(timezone_name)
    except ZoneInfoNotFoundError as exc:
        raise ValueError("Choose a valid IANA timezone, such as Asia/Kolkata") from exc
    start = _next_local_start(local_time, timezone_name, weekdays)
    end = start + timedelta(minutes=duration_minutes)
    access = await access_token(org_id, organizer_id)
    recurrence_days = ",".join(WEEKDAYS[day] for day in sorted(set(weekdays)))
    payload = {
        "summary": f"{team_name} Daily Standup",
        "description": f"Recurring NovaScan standup for {team_name}.",
        "start": {"dateTime": start.isoformat(), "timeZone": timezone_name},
        "end": {"dateTime": end.isoformat(), "timeZone": timezone_name},
        "recurrence": [f"RRULE:FREQ=WEEKLY;BYDAY={recurrence_days}"],
        "attendees": [{"email": email} for email in sorted(set(member_emails)) if email],
        "conferenceData": {"createRequest": {"requestId": str(uuid.uuid4()), "conferenceSolutionKey": {"type": "hangoutsMeet"}}},
    }
    async with httpx.AsyncClient(timeout=25.0) as client:
        response = await client.post(
            f"{CALENDAR_API}/calendars/primary/events",
            params={"conferenceDataVersion": 1, "sendUpdates": "all"},
            headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"},
            json=payload,
        )
    if response.status_code not in (200, 201):
        logger.error("Google Calendar event creation failed (%s): %s", response.status_code, response.text[:600])
        raise ValueError("Google Calendar could not create the standup. Verify Calendar API access and organizer permissions.")
    event = response.json()
    # Google may create the Calendar event before finishing its asynchronous
    # conference request. Briefly poll the new event so the UI can return the
    # Meet URL immediately in the common case.
    for _ in range(3):
        conference = event.get("conferenceData") or {}
        if event.get("hangoutLink") or conference.get("entryPoints"):
            break
        await asyncio.sleep(1)
        async with httpx.AsyncClient(timeout=15.0) as client:
            refreshed = await client.get(
                f"{CALENDAR_API}/calendars/primary/events/{event.get('id')}",
                headers={"Authorization": f"Bearer {access}"},
            )
        if refreshed.status_code == 200:
            event = refreshed.json()
    return {
        "id": event.get("id"),
        "html_link": event.get("htmlLink"),
        "meet_url": event.get("hangoutLink"),
        "conference_id": (event.get("conferenceData") or {}).get("conferenceId"),
        "start": start,
        "end": end,
        "timezone": timezone_name,
        "recurrence": payload["recurrence"],
        "organizer_id": str(organizer_id),
        "weekdays": sorted(set(weekdays)),
        "local_time": local_time,
        "duration_minutes": duration_minutes,
    }


async def create_calendar_event(org_id: str, organizer_id: str, *, title: str, start: datetime, end: datetime, timezone_name: str, description: str = "", attendee_emails: Optional[List[str]] = None):
    access = await access_token(org_id, organizer_id)
    payload = {
        "summary": title,
        "description": description,
        "start": {"dateTime": start.isoformat(), "timeZone": timezone_name},
        "end": {"dateTime": end.isoformat(), "timeZone": timezone_name},
        "attendees": [{"email": email} for email in sorted(set(attendee_emails or [])) if email],
    }
    async with httpx.AsyncClient(timeout=25.0) as client:
        response = await client.post(
            f"{CALENDAR_API}/calendars/primary/events",
            params={"sendUpdates": "all"},
            headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"},
            json=payload,
        )
    if response.status_code not in (200, 201):
        logger.warning("Google Calendar event creation failed (%s): %s", response.status_code, response.text[:400])
        raise ValueError("Google Calendar could not create this event")
    return response.json()


async def delete_event(org_id: str, organizer_id: str, event_id: str) -> None:
    access = await access_token(org_id, organizer_id)
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.delete(
            f"{CALENDAR_API}/calendars/primary/events/{event_id}",
            params={"sendUpdates": "all"},
            headers={"Authorization": f"Bearer {access}"},
        )
    if response.status_code not in (200, 204, 404, 410):
        logger.warning("Google Calendar event deletion failed (%s): %s", response.status_code, response.text[:400])


async def list_events(org_id: str, organizer_id: str, *, time_min: datetime, time_max: datetime):
    access = await access_token(org_id, organizer_id)
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"{CALENDAR_API}/calendars/primary/events",
            params={"timeMin": time_min.isoformat() + "Z", "timeMax": time_max.isoformat() + "Z", "singleEvents": "true", "orderBy": "startTime", "maxResults": 100},
            headers={"Authorization": f"Bearer {access}"},
        )
    if response.status_code != 200:
        logger.warning("Google Calendar event list failed (%s): %s", response.status_code, response.text[:400])
        return []
    return response.json().get("items", [])


async def fetch_meet_transcripts(org_id: str, organizer_id: str, meet_url: str, *, time_min: datetime, time_max: datetime):
    """Fetch transcript entries for Meet conferences attached to a team's recurring event."""
    meeting_code = (re.search(r"meet\.google\.com/([a-z0-9-]+)", meet_url or "", re.I) or [None, None])[1]
    if not meeting_code:
        raise ValueError("The scheduled event does not have a Google Meet link")
    token = await access_token(org_id, organizer_id)
    headers = {"Authorization": f"Bearer {token}"}
    conference_filter = f'space.meeting_code = "{meeting_code}" AND start_time >= "{time_min.isoformat()}Z" AND start_time <= "{time_max.isoformat()}Z"'
    async with httpx.AsyncClient(timeout=25.0) as client:
        conference_response = await client.get(
            "https://meet.googleapis.com/v2/conferenceRecords",
            params={"filter": conference_filter, "pageSize": 100}, headers=headers,
        )
        if conference_response.status_code != 200:
            logger.warning("Meet conference lookup failed (%s): %s", conference_response.status_code, conference_response.text[:500])
            raise ValueError("Google Meet transcripts are unavailable. Confirm Meet API access and transcript permissions.")
        results = []
        conferences = conference_response.json().get("conferenceRecords", [])
        for conference in conferences:
            conference_name = conference.get("name")
            if not conference_name:
                continue
            transcripts_response = await client.get(f"https://meet.googleapis.com/v2/{conference_name}/transcripts", params={"pageSize": 100}, headers=headers)
            if transcripts_response.status_code != 200:
                continue
            for transcript in transcripts_response.json().get("transcripts", []):
                transcript_name = transcript.get("name")
                if not transcript_name or transcript.get("state") != "FILE_GENERATED":
                    continue
                entries_response = await client.get(f"https://meet.googleapis.com/v2/{transcript_name}/entries", params={"pageSize": 100}, headers=headers)
                if entries_response.status_code != 200:
                    continue
                entries = entries_response.json().get("transcriptEntries", [])
                text = "\n".join(f"{entry.get('participant', 'Participant')}: {entry.get('text', '')}" for entry in entries if entry.get("text"))
                if text.strip():
                    results.append({"transcript_id": transcript_name, "conference_id": conference_name, "started_at": transcript.get("startTime"), "text": text})
    return results
