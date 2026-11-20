from fastapi import APIRouter, Depends
from bson import ObjectId
from app.models.user import User
from app.api.v1.endpoints.auth import get_current_user
from app.core.database import get_database

router = APIRouter()


def _id_values(value):
    if value is None:
        return []
    text = str(value)
    values = [text]
    if ObjectId.is_valid(text):
        values.append(ObjectId(text))
    return values


def _serialize(document: dict) -> dict:
    for key, value in list(document.items()):
        if isinstance(value, ObjectId):
            document[key] = str(value)
        elif isinstance(value, list):
            document[key] = [str(item) if isinstance(item, ObjectId) else item for item in value]
    if "_id" in document:
        document["_id"] = str(document["_id"])
    return document


@router.get("/workspace")
async def get_workspace(current_user: User = Depends(get_current_user)):
    """Return dashboard records scoped to the authenticated user's assignments."""
    db = get_database()
    if not current_user.current_org_id:
        return {
            "projects": [], "risks": [], "teams": [], "standups": [], "tasks": [],
            "critical_risks": 0, "health_score": None, "employee_count": 0,
        }

    org_ids = _id_values(current_user.current_org_id)
    user_ids = _id_values(current_user.id)
    project_query = {"organization_id": {"$in": org_ids}}
    if current_user.role == "manager":
        project_query["$or"] = [
            {"manager_id": {"$in": user_ids}},
            {"employee_ids": {"$in": user_ids}},
        ]
    elif current_user.role == "employee":
        project_query["employee_ids"] = {"$in": user_ids}
    projects = await db["projects"].find(project_query).sort("updated_at", -1).limit(100).to_list(length=100)
    projects = [_serialize(project) for project in projects]
    project_ids = [project["_id"] for project in projects]
    repo_names = [
        f"{project.get('repo_owner', '')}/{project.get('repo_name', '')}".strip("/")
        for project in projects if project.get("repo_owner") and project.get("repo_name")
    ]

    scan_query = {"org_id": {"$in": org_ids}}
    if current_user.role not in ("admin", "hr"):
        scan_query["$or"] = []
        if project_ids:
            scan_query["$or"].append({"project_id": {"$in": [v for value in project_ids for v in _id_values(value)]}})
        if repo_names:
            scan_query["$or"].append({"repo": {"$in": repo_names}})
        if not scan_query["$or"]:
            scan_query["_id"] = {"$exists": False}
        else:
            scan_query.pop("org_id", None)
            scan_query = {"$and": [{"org_id": {"$in": org_ids}}, {"$or": scan_query["$or"]}]}
    scans = await db["scans"].find(scan_query).sort("timestamp", -1).limit(100).to_list(length=100)
    # Historical webhook rows may store org_id as either a string or ObjectId.
    # For assigned roles, repo scoping is authoritative and can recover those
    # older rows without widening access to unrelated repositories.
    if current_user.role not in ("admin", "hr") and repo_names:
        scoped_scans = await db["scans"].find({"repo": {"$in": repo_names}}).sort("timestamp", -1).limit(100).to_list(length=100)
        seen_scan_ids = {str(scan.get("_id")) for scan in scans}
        scans.extend(scan for scan in scoped_scans if str(scan.get("_id")) not in seen_scan_ids)
        scans.sort(key=lambda scan: scan.get("timestamp") or 0, reverse=True)
        scans = scans[:100]

    team_query = {"organization_id": {"$in": org_ids}}
    if current_user.role == "manager":
        team_query["$or"] = [{"manager_id": {"$in": user_ids}}]
    elif current_user.role == "employee":
        team_query["$or"] = [{"member_ids": {"$in": user_ids}}]
    if current_user.role in ("manager", "employee"):
        linked_team_ids = [project.get("team_id") for project in projects if project.get("team_id")]
        if linked_team_ids:
            team_query["$or"].append({"_id": {"$in": [v for value in linked_team_ids for v in _id_values(value)]}})
    teams = await db["teams"].find(team_query).limit(100).to_list(length=100)
    teams = [_serialize(team) for team in teams]
    team_ids = [team["_id"] for team in teams]

    standup_query = {"organization_id": {"$in": org_ids}, "team_archived": {"$ne": True}}
    if current_user.role not in ("admin", "hr"):
        visible_standup_records = []
        if team_ids:
            visible_standup_records.append({"team_id": {"$in": [v for value in team_ids for v in _id_values(value)]}})
        if project_ids:
            visible_standup_records.append({"project_id": {"$in": [v for value in project_ids for v in _id_values(value)]}})
        standup_query["$or"] = visible_standup_records or [{"_id": {"$exists": False}}]
    standups = await db["standups"].find(standup_query).sort("date", -1).limit(20).to_list(length=20)

    task_query = {"organization_id": {"$in": org_ids}}
    if current_user.role not in ("admin", "hr"):
        task_query["$or"] = [{"team_id": {"$in": [v for value in team_ids for v in _id_values(value)]}}]
        if current_user.role == "employee":
            task_query["$or"].append({"assignee_id": {"$in": user_ids}})
    tasks = await db["standup_tasks"].find(task_query).sort("updated_at", -1).limit(100).to_list(length=100)

    def score(scan):
        try:
            return float(scan.get("risk_score", (scan.get("analysis") or {}).get("risk_score")))
        except (TypeError, ValueError):
            return None

    scan_scores = [score(scan) for scan in scans]
    critical_risks = sum(1 for value in scan_scores if value is not None and value >= 8)
    analyzed_scans = [value for value in scan_scores if value is not None]
    # Health score is an explicit severity-based calculation over available scans.
    # Empty history is unknown (None), not an invented 100%.
    health_score = round(100 - (sum(analyzed_scans) / len(analyzed_scans)) * 10) if analyzed_scans else None
    employee_count = await db["users"].count_documents({
        "current_org_id": {"$in": org_ids}, "role": "employee",
    }) if current_user.role in ("admin", "hr") else None

    return {
        "projects": projects,
        "risks": [_serialize(scan) for scan in scans],
        "teams": teams,
        "standups": [_serialize(item) for item in standups],
        "tasks": [_serialize(item) for item in tasks],
        "critical_risks": critical_risks,
        "health_score": health_score,
        "employee_count": employee_count,
    }

@router.get("/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    db = get_database()
    org_id = current_user.current_org_id

    if not org_id:
        return {
            "total_risks": 0,
            "active_integrations": 0,
            "recent_activity": []
        }

    # 1. Count Total Risks
    total_risks = await db["events"].count_documents({
        "org_id": org_id,
        "analysis.is_risky": True
    })

    # 2. Recent Activity
    recent_events = await db["events"].find(
        {"org_id": org_id}
    ).sort("created_at", -1).limit(5).to_list(length=5)

    # 3. Risk Distribution
    return {
        "total_risks": total_risks,
        # OAuth connections are stored against a project, so count those
        # records for the organization instead of the obsolete shared vault.
        "active_integrations": await db["oauth_connections"].count_documents({
            "org_id": org_id,
            "status": "connected",
        }),
        "recent_activity": [
            {
                "summary": e.get("summary", "No summary available"),
                "risk_score": e.get("analysis", {}).get("risk_score", 0)
            }
            for e in recent_events
        ]
    }