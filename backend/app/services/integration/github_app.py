"""GitHub App authentication helpers with repository-scoped installation tokens."""
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

import httpx
from jose import jwt

from app.core.config import settings


def github_app_configured() -> bool:
    """Return whether the GitHub App OAuth and signed webhook settings are ready."""
    return bool(
        getattr(settings, "GITHUB_APP_ID", None)
        and getattr(settings, "GITHUB_APP_SLUG", None)
        and getattr(settings, "GITHUB_APP_PRIVATE_KEY", None)
        and getattr(settings, "GITHUB_APP_CLIENT_ID", None)
        and getattr(settings, "GITHUB_APP_CLIENT_SECRET", None)
        and getattr(settings, "GITHUB_WEBHOOK_SECRET", None)
    )


def _app_jwt() -> str:
    if not (settings.GITHUB_APP_ID and settings.GITHUB_APP_PRIVATE_KEY):
        raise RuntimeError("GitHub App ID and private key are not configured")
    private_key = settings.GITHUB_APP_PRIVATE_KEY.replace("\\n", "\n")
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"iat": int((now - timedelta(seconds=30)).timestamp()),
         "exp": int((now + timedelta(minutes=8)).timestamp()),
         "iss": settings.GITHUB_APP_ID},
        private_key,
        algorithm="RS256",
    )


async def create_repository_token(installation_id: str, repository_id: str) -> str:
    """Mint an ephemeral token that can access exactly the supplied repository."""
    headers = {
        "Authorization": f"Bearer {_app_jwt()}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(
            f"https://api.github.com/app/installations/{installation_id}/access_tokens",
            headers=headers,
            json={
                "repository_ids": [int(repository_id)],
                "permissions": {"contents": "read", "pull_requests": "read"},
            },
        )
    if response.status_code != 201:
        raise RuntimeError(f"Could not create repository-scoped GitHub token ({response.status_code})")
    token = response.json().get("token")
    if not token:
        raise RuntimeError("GitHub did not return an installation token")
    return token


async def authorize_installation(installation_id: str, code: str, expected_repo: str) -> Dict[str, Any]:
    """Verify the installing GitHub user and ensure the exact project repo was selected."""
    if not (settings.GITHUB_APP_CLIENT_ID and settings.GITHUB_APP_CLIENT_SECRET):
        raise RuntimeError("GitHub App OAuth client credentials are not configured")
    async with httpx.AsyncClient(timeout=20.0) as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            json={
                "client_id": settings.GITHUB_APP_CLIENT_ID,
                "client_secret": settings.GITHUB_APP_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.github_redirect,
            },
        )
        token_data = token_response.json()
        user_token = token_data.get("access_token")
        if not user_token:
            raise RuntimeError("GitHub could not authorize the installing user")
        headers = {
            "Authorization": f"Bearer {user_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        user_response = await client.get("https://api.github.com/user", headers=headers)
        if user_response.status_code != 200:
            raise RuntimeError("Could not verify the GitHub user who installed the app")
        installations = []
        page = 1
        while True:
            installations_response = await client.get(
                "https://api.github.com/user/installations",
                headers=headers,
                params={"per_page": 100, "page": page},
            )
            if installations_response.status_code != 200:
                raise RuntimeError("Could not verify the GitHub App installation")
            page_installations = installations_response.json().get("installations", [])
            installations.extend(page_installations)
            if len(page_installations) < 100:
                break
            page += 1
        installation = next((item for item in installations if str(item.get("id")) == str(installation_id)), None)
        if not installation:
            raise RuntimeError("This GitHub installation is not associated with the authorizing user")
        if installation.get("repository_selection") != "selected":
            raise RuntimeError('The GitHub App must be installed with "Only select repositories"; all-repository access is not accepted')
        repos = []
        page = 1
        while True:
            repos_response = await client.get(
                f"https://api.github.com/user/installations/{installation_id}/repositories",
                headers=headers,
                params={"per_page": 100, "page": page},
            )
            if repos_response.status_code != 200:
                raise RuntimeError("Could not verify this GitHub installation and its selected repositories")
            page_repos = repos_response.json().get("repositories", [])
            repos.extend(page_repos)
            if len(page_repos) < 100:
                break
            page += 1
        matching = next(
            (repo for repo in repos if (repo.get("full_name") or "").casefold() == expected_repo.casefold()),
            None,
        )
        if not matching:
            raise RuntimeError(
                f"Select {expected_repo} in GitHub's repository access step, then retry the connection"
            )
        user = user_response.json()
        return {
            "login": user.get("login") or "GitHub user",
            "user_name": user.get("name"),
            "repository_id": str(matching["id"]),
            "repository_full_name": matching.get("full_name"),
            "account_name": (matching.get("owner") or {}).get("login"),
        }
