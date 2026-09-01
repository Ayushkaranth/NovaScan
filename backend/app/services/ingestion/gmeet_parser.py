import re
import json
from typing import Dict, Any, List

def parse_google_meet_transcript(raw_payload: Any) -> Dict[str, Any]:
    """
    Parses raw Google Meet transcript input (JSON, raw text, VTT, or third-party webhooks)
    into a standardized, structured in-memory transcript payload.
    """
    meeting_title = "Google Meet Synchronization Session"
    speakers: List[str] = []
    lines: List[Dict[str, str]] = []

    # Case 1: Payload is already a structured JSON object from third-party Webhook / Extension
    if isinstance(raw_payload, dict):
        meeting_title = raw_payload.get("title", raw_payload.get("meeting_name", meeting_title))
        transcript_items = raw_payload.get("transcript", raw_payload.get("dialogue", []))
        
        if isinstance(transcript_items, list):
            for item in transcript_items:
                if isinstance(item, dict):
                    speaker = item.get("speaker", item.get("user", "Participant"))
                    text = item.get("text", item.get("content", ""))
                    if text:
                        if speaker not in speakers:
                            speakers.append(speaker)
                        lines.append({"speaker": speaker, "text": text.strip()})
        elif isinstance(transcript_items, str):
            raw_text = transcript_items
            lines, speakers = _parse_plain_transcript_text(raw_text)

    # Case 2: Payload is raw string (Plain text, VTT or Webhook body string)
    elif isinstance(raw_payload, str):
        lines, speakers = _parse_plain_transcript_text(raw_payload)

    formatted_transcript = "\n".join([f"{item['speaker']}: {item['text']}" for item in lines])

    return {
        "title": meeting_title,
        "speakers": speakers,
        "dialogue": lines,
        "full_text": formatted_transcript,
        "total_lines": len(lines)
    }

def _parse_plain_transcript_text(text: str):
    lines = []
    speakers = []
    # Match patterns like "John Doe: Let's fix the API rate limit" or "[00:12] Alice: Deploying hotfix"
    pattern = re.compile(r'^(?:\[.*?\]\s*)?([A-Za-z0-9\s_-]+):\s*(.+)$', re.MULTILINE)
    matches = pattern.findall(text)

    if matches:
        for speaker, content in matches:
            speaker_clean = speaker.strip()
            if speaker_clean not in speakers:
                speakers.append(speaker_clean)
            lines.append({"speaker": speaker_clean, "text": content.strip()})
    else:
        # Fallback for plain unformatted paragraphs
        paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
        for idx, p in enumerate(paragraphs):
            speaker = f"Participant {(idx % 3) + 1}"
            if speaker not in speakers:
                speakers.append(speaker)
            lines.append({"speaker": speaker, "text": p})

    return lines, speakers
