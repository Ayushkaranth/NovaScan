"""GitHub App authentication helpers with repository-scoped installation tokens."""
from datetime import datetime, timedelta, timezone
import base64
import binascii
import re
from typing import Any, Dict
from urllib.parse import quote

import httpx
from jose import jwt

from app.core.config import settings


def github_app_configured() -> bool:
    """Return whether the GitHub App OAuth and signed webhook settings are ready."""
    return bool(
        getattr(settings, "GITHUB_APP_ID", None)
        and getattr(settings, "GITHUB_APP_SLUG", None)
        and (getattr(settings, "GITHUB_APP_PRIVATE_KEY_BASE64", None) or getattr(settings, "GITHUB_APP_PRIVATE_KEY", None))
        and getattr(settings, "GITHUB_APP_CLIENT_ID", None)
        and getattr(settings, "GITHUB_APP_CLIENT_SECRET", None)
        and getattr(settings, "GITHUB_WEBHOOK_SECRET", None)
    )


def _app_jwt() -> str:
    encoded_key = getattr(settings, "GITHUB_APP_PRIVATE_KEY_BASE64", None)
    raw_key = getattr(settings, "GITHUB_APP_PRIVATE_KEY", None)
    if not (settings.GITHUB_APP_ID and (encoded_key or raw_key)):
        raise RuntimeError("GitHub App ID and private key are not configured")
    if encoded_key:
        try:
            private_key = base64.b64decode(re.sub(r"\s+", "", str(encoded_key)), validate=True).decode("utf-8-sig")
        except (binascii.Error, UnicodeDecodeError, ValueError) as exc:
            raise RuntimeError("GITHUB_APP_PRIVATE_KEY_BASE64 must be Base64-encoded UTF-8 PEM file contents") from exc
    else:
        private_key = str(raw_key).strip()
    if len(private_key) >= 2 and private_key[0] == private_key[-1] and private_key[0] in ("\"", "'"):
        private_key = private_key[1:-1].strip()
    private_key = (
        private_key
        .replace("\\r\\n", "\n")
        .replace("\\n", "\n")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
    )

    # Render and other environment managers may preserve a pasted PEM as one
    # long line. Canonicalize only a recognizable, unencrypted PEM block.
    pem = re.search(r"-----BEGIN ((?:RSA |EC )?PRIVATE KEY)-----([\s\S]*?)-----END \1-----", private_key)
    if pem:
        body = re.sub(r"\s+", "", pem.group(2))
        if body and re.fullmatch(r"[A-Za-z0-9+/=]+", body):
            private_key = (
                f"-----BEGIN {pem.group(1)}-----\n"
                + "\n".join(body[index:index + 64] for index in range(0, len(body), 64))
                + f"\n-----END {pem.group(1)}-----\n"
            )
    now = datetime.now(timezone.utc)
    try:
        return jwt.encode(
            {"iat": int((now - timedelta(seconds=30)).timestamp()),
             "exp": int((now + timedelta(minutes=8)).timestamp()),
             "iss": settings.GITHUB_APP_ID},
            private_key,
            algorithm="RS256",
        )
    except Exception as exc:
        raise RuntimeError(
            "GitHub App private key is not valid PEM. In Render, replace GITHUB_APP_PRIVATE_KEY with the complete, unencrypted .pem file contents, including both BEGIN/END lines."
        ) from exc


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


async def verify_installation_repository(installation_id: str, expected_repo: str) -> Dict[str, Any]:
    """Verify a GitHub setup callback using app credentials (no OAuth code required)."""
    headers = {
        "Authorization": f"Bearer {_app_jwt()}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        installation_response = await client.get(
            f"https://api.github.com/app/installations/{installation_id}", headers=headers
        )
        if installation_response.status_code != 200:
            raise RuntimeError("Could not verify this GitHub App installation")
        installation = installation_response.json()
        if installation.get("repository_selection") != "selected":
            raise RuntimeError('Install the app with "Only select repositories" to connect a project repository')

        token_response = await client.post(
            f"https://api.github.com/app/installations/{installation_id}/access_tokens",
            headers=headers,
            json={"permissions": {"contents": "read", "pull_requests": "read"}},
        )
        if token_response.status_code != 201:
            raise RuntimeError("Could not inspect repositories granted to this GitHub installation")
        installation_token = token_response.json().get("token")
        if not installation_token:
            raise RuntimeError("GitHub did not return an installation token")

        repo_headers = {
            "Authorization": f"Bearer {installation_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        repositories = []
        page = 1
        while True:
            repositories_response = await client.get(
                "https://api.github.com/installation/repositories",
                headers=repo_headers,
                params={"per_page": 100, "page": page},
            )
            if repositories_response.status_code != 200:
                raise RuntimeError("Could not verify repositories granted to this GitHub installation")
            batch = repositories_response.json().get("repositories", [])
            repositories.extend(batch)
            if len(batch) < 100:
                break
            page += 1

    matching = next(
        (repo for repo in repositories if (repo.get("full_name") or "").casefold() == expected_repo.casefold()),
        None,
    )
    if not matching:
        raise RuntimeError(f"This installation does not have access to {expected_repo}. Select that repository in GitHub and retry.")
    account = installation.get("account") or {}
    return {
        "installation_id": str(installation_id),
        "login": account.get("login") or "GitHub account",
        "account_name": account.get("login") or "GitHub account",
        "repository_id": str(matching["id"]),
        "repository_full_name": matching.get("full_name"),
    }


async def find_repository_installation(expected_repo: str) -> str:
    """Resolve the GitHub App installation for the repository in signed OAuth state."""
    owner, separator, name = expected_repo.partition("/")
    if not separator or not owner or not name:
        raise RuntimeError("The project repository is not configured as owner/repository")
    headers = {
        "Authorization": f"Bearer {_app_jwt()}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(
            f"https://api.github.com/repos/{quote(owner, safe='')}/{quote(name, safe='')}/installation", headers=headers
        )
    if response.status_code != 200:
        raise RuntimeError(f"NovaScan is not installed for {expected_repo}; install the GitHub App and select this repository")
    installation_id = response.json().get("id")
    if not installation_id:
        raise RuntimeError("GitHub did not return an installation ID for this repository")
    return str(installation_id)
