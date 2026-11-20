"""Re-run saved PR scan assessments using the current model/key settings.

Run from the backend directory in an environment with production MongoDB,
GitHub App, and Gemini/BYOK configuration. Requires --apply to write results.
"""
import argparse
import asyncio
import logging
import sys
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx
from bson import ObjectId

# Allow direct invocation as `python scripts/reanalyze_scans.py` from backend/.
BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.database import close_mongo_connection, connect_to_mongo, get_database
from app.services.integration.oauth_token_manager import oauth_token_manager
from app.services.integration.github_app import create_repository_token
from app.services.intelligence.llm_engine import analyze_code
from app.api.v1.endpoints.webhooks import _organization_ai_config
from app.api.v1.endpoints.webhooks import dispatch_notifications, get_org_credentials

logger = logging.getLogger("reanalyze_scans")


async def fetch_diff(token: str, repo: str, pr_number: int) -> str:
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3.diff",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        response = await client.get(f"https://github.com/{repo}/pull/{pr_number}.diff", headers=headers)
        if response.status_code == 200 and response.text.strip():
            return response.text
        response = await client.get(
            f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files",
            headers={**headers, "Accept": "application/vnd.github+json"},
            params={"per_page": 100},
        )
        if response.status_code != 200:
            logger.warning("GitHub diff unavailable for %s#%s (HTTP %s)", repo, pr_number, response.status_code)
            return ""
        return "\n\n".join(
            f"### {item.get('filename', 'changed file')}\n{item['patch']}"
            for item in response.json()
            if item.get("patch")
        )


async def project_for_scan(db, org_id: str, repo: str) -> Optional[dict]:
    owner, separator, name = repo.partition("/")
    if not separator or not owner or not name:
        return None
    org_values = [org_id]
    if ObjectId.is_valid(org_id):
        org_values.append(ObjectId(org_id))
    return await db["projects"].find_one({
        "organization_id": {"$in": org_values},
        "repo_owner": {"$regex": f"^{re.escape(owner)}$", "$options": "i"},
        "repo_name": {"$regex": f"^{re.escape(name)}$", "$options": "i"},
    })


async def github_token_for_project(org_id: str, project: dict) -> Optional[str]:
    project_id = str(project["_id"])
    connection = await oauth_token_manager.get_connection(org_id, project_id, "github")
    if connection:
        if connection.get("mode") == "github_app_repository":
            if not connection.get("installation_id") or not connection.get("repository_id"):
                return None
            return await create_repository_token(connection["installation_id"], connection["repository_id"])
        return connection.get("access_token") or connection.get("github_access_token")

    # Support projects using the older token-in-project-settings integration.
    settings = project.get("settings") or {}
    return settings.get("github_access_token") or settings.get("github_token")


async def run(apply: bool, org_filter: Optional[str], limit: Optional[int]) -> None:
    await connect_to_mongo()
    db = get_database()
    if db is None:
        raise RuntimeError("MongoDB connection is unavailable")

    query = {}
    if org_filter:
        org_values = [org_filter]
        if ObjectId.is_valid(org_filter):
            org_values.append(ObjectId(org_filter))
        query["org_id"] = {"$in": org_values}
    cursor = db["scans"].find(query, {
        "org_id": 1, "repo": 1, "pr_id": 1, "pr_title": 1, "pr_url": 1,
        "risk_score": 1, "summary": 1, "is_risky": 1,
    }).sort("timestamp", -1)
    if limit:
        cursor = cursor.limit(limit)
    scans = await cursor.to_list(length=limit or 100000)

    # Avoid paying for duplicate webhook deliveries of the same PR.
    groups = {}
    for scan in scans:
        org_id = str(scan.get("org_id") or "")
        repo = str(scan.get("repo") or "")
        try:
            pr_number = int(scan.get("pr_id"))
        except (TypeError, ValueError):
            continue
        if org_id and repo and pr_number > 0:
            groups.setdefault((org_id, repo, pr_number), []).append(scan)

    print(f"Scans loaded: {len(scans)}; unique PRs: {len(groups)}; mode: {'APPLY' if apply else 'DRY RUN'}")
    projects = {}
    tokens = {}
    ai_configs = {}
    succeeded = skipped = failed = 0

    for index, ((org_id, repo, pr_number), rows) in enumerate(groups.items(), start=1):
        try:
            if org_id not in ai_configs:
                ai_configs[org_id] = await _organization_ai_config(org_id)
            project_key = (org_id, repo)
            if project_key not in projects:
                projects[project_key] = await project_for_scan(db, org_id, repo)
            project = projects[project_key]
            if not project:
                logger.warning("No project matches org=%s repo=%s; skipping", org_id, repo)
                skipped += 1
                continue
            project_id = str(project["_id"])
            token_key = (org_id, project_id)
            if token_key not in tokens:
                tokens[token_key] = await github_token_for_project(org_id, project)
            token = tokens[token_key]
            if not token:
                logger.warning("No GitHub read connection for org=%s repo=%s; skipping", org_id, repo)
                skipped += 1
                continue
            diff = await fetch_diff(token, repo, pr_number)
            if not diff:
                logger.warning("No diff available for %s#%s; leaving saved score unchanged", repo, pr_number)
                skipped += 1
                continue
            api_key, provider = ai_configs[org_id]
            title = rows[0].get("pr_title") or f"Pull request #{pr_number}"
            result = await analyze_code(diff, {"title": title, "body": ""}, custom_api_key=api_key, provider=provider)
            if result.get("analysis_status") == "failed" or result.get("risk_score") is None:
                logger.warning("AI analysis failed for %s#%s; saved score left unchanged", repo, pr_number)
                failed += 1
                continue

            if apply:
                now = datetime.utcnow()
                for row in rows:
                    old = {
                        "risk_score": row.get("risk_score"),
                        "summary": row.get("summary"),
                        "is_risky": row.get("is_risky"),
                        "replaced_at": now,
                    }
                    await db["scans"].update_one(
                        {"_id": row["_id"]},
                        {
                            "$push": {"reanalysis_history": {"$each": [old], "$slice": -5}},
                            "$set": {
                                "risk_score": result.get("risk_score"),
                                "analysis_status": "complete",
                                "is_risky": bool(result.get("is_risky")),
                                "summary": result.get("reason") or result.get("summary") or "Analysis completed",
                                "action_needed": result.get("action_needed"),
                                "recommendations": result.get("recommendations", []),
                                "impact": result.get("impact"),
                                "affected_areas": result.get("affected_areas", []),
                                "reanalyzed_at": now,
                                "project_id": project_id,
                            },
                        },
                    )
            succeeded += 1
            print(f"[{index}/{len(groups)}] {'updated' if apply else 'would update'} {repo}#{pr_number}: {result['risk_score']}/10")
        except Exception as exc:
            logger.exception("Reanalysis failed for %s#%s (%s)", repo, pr_number, type(exc).__name__)
            failed += 1

    print(f"Finished. successful={succeeded}, skipped={skipped}, failed={failed}")
    await close_mongo_connection()


async def deliver_saved_scans(apply: bool, org_filter: Optional[str], limit: Optional[int]) -> None:
    """Create missing Notion/Jira/Slack artifacts for saved medium+ risks."""
    await connect_to_mongo()
    db = get_database()
    if db is None:
        raise RuntimeError("MongoDB connection is unavailable")
    query = {}
    if org_filter:
        org_values = [org_filter]
        if ObjectId.is_valid(org_filter):
            org_values.append(ObjectId(org_filter))
        query["org_id"] = {"$in": org_values}
    cursor = db["scans"].find(query).sort("timestamp", -1)
    if limit:
        cursor = cursor.limit(limit)
    scans = await cursor.to_list(length=limit or 100000)
    grouped = {}
    for scan in scans:
        try:
            score = float(scan.get("risk_score"))
            pr_id = int(scan.get("pr_id"))
        except (TypeError, ValueError):
            continue
        if score < 4 or not scan.get("repo") or pr_id < 1:
            continue
        key = (str(scan.get("org_id") or ""), scan["repo"], pr_id)
        grouped.setdefault(key, []).append(scan)

    print(f"Eligible risks: {len(grouped)}; mode: {'APPLY' if apply else 'DRY RUN'}")
    successful = skipped = failed = 0
    for index, ((org_id, repo, pr_id), rows) in enumerate(grouped.items(), start=1):
        project = await project_for_scan(db, org_id, repo)
        if not project:
            logger.warning("No project matches org=%s repo=%s; skipped", org_id, repo)
            skipped += 1
            continue
        creds = await get_org_credentials(org_id, repo, str(project["_id"]), include_github_token=False)
        if not creds:
            logger.warning("No project integrations for org=%s repo=%s; skipped", org_id, repo)
            skipped += 1
            continue
        scan = rows[0]
        risk_data = {
            "risk_score": scan.get("risk_score"), "is_risky": scan.get("is_risky"),
            "reason": scan.get("summary") or "Risk identified in saved pull request scan.",
            "action_needed": scan.get("action_needed"), "recommendations": scan.get("recommendations", []),
            "impact": scan.get("impact"), "affected_areas": scan.get("affected_areas", []),
        }
        event = {
            "summary": f"PR #{pr_id} in {repo}", "title": scan.get("pr_title") or f"Pull request #{pr_id}",
            "url": scan.get("pr_url") or f"https://github.com/{repo}/pull/{pr_id}",
            "repo": repo, "pr_id": pr_id, "author": scan.get("author") or "Unknown",
        }
        existing = next((row.get("deliveries") for row in rows if row.get("deliveries")), {})
        print(f"[{index}/{len(grouped)}] {repo}#{pr_id} score={risk_data['risk_score']}")
        if not apply:
            continue
        try:
            deliveries = await dispatch_notifications(creds, risk_data, event, org_id, existing_delivery=existing)
            for row in rows:
                await db["scans"].update_one({"_id": row["_id"]}, {"$set": {"deliveries": deliveries, "deliveries_updated_at": datetime.utcnow()}})
            successful += 1
            print("  delivery status:", ", ".join(f"{name}={data['status']}" for name, data in deliveries.items()))
        except Exception as exc:
            logger.exception("Delivery failed for %s#%s (%s)", repo, pr_id, type(exc).__name__)
            failed += 1
    print(f"Finished delivery. processed={successful}, skipped={skipped}, failed={failed}")
    await close_mongo_connection()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true", help="Write successful reassessments back to MongoDB")
    parser.add_argument("--org-id", help="Limit to a single organization; omit to process all organizations")
    parser.add_argument("--limit", type=int, help="Limit the number of saved scan rows to inspect")
    parser.add_argument("--deliver", action="store_true", help="Deliver existing scans to configured Notion/Jira/Slack integrations; does not rerun AI")
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    if args.deliver:
        asyncio.run(deliver_saved_scans(args.apply, args.org_id, args.limit))
    else:
        asyncio.run(run(args.apply, args.org_id, args.limit))


if __name__ == "__main__":
    main()
