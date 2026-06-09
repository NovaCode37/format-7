from __future__ import annotations
import os
import secrets
from typing import Any

import httpx
from sqlalchemy.orm import Session

from models import User

PROVIDERS = {
    "yandex": {
        "authorize_url": "https://oauth.yandex.ru/authorize",
        "token_url": "https://oauth.yandex.ru/token",
        "profile_url": "https://login.yandex.ru/info?format=json",
        "scope": "login:email login:info",
        "client_id_env": "YANDEX_CLIENT_ID",
        "secret_env": "YANDEX_CLIENT_SECRET",
    },
    "vk": {
        "authorize_url": "https://id.vk.com/authorize",
        "token_url": "https://id.vk.com/oauth2/auth",
        "profile_url": "https://id.vk.com/oauth2/user_info",
        "scope": "email",
        "client_id_env": "VK_CLIENT_ID",
        "secret_env": "VK_CLIENT_SECRET",
    },
}

class OAuthError(Exception):
    pass

def provider_configured(provider: str) -> bool:
    cfg = PROVIDERS.get(provider)
    if not cfg:
        return False
    return bool(os.environ.get(cfg["client_id_env"], "").strip() and os.environ.get(cfg["secret_env"], "").strip())

def _redirect_uri(provider: str) -> str:
    base = os.environ.get("PUBLIC_SITE_URL", "http://localhost:3000").rstrip("/")
    return f"{base}/api/auth/{provider}/callback"

def build_authorize_url(provider: str, state: str) -> str:
    cfg = PROVIDERS[provider]
    client_id = os.environ[cfg["client_id_env"]]
    from urllib.parse import urlencode

    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": _redirect_uri(provider),
        "state": state,
        "scope": cfg["scope"],
    }
    return f"{cfg['authorize_url']}?{urlencode(params)}"

def exchange_code(provider: str, code: str) -> str:

    cfg = PROVIDERS[provider]
    client_id = os.environ[cfg["client_id_env"]]
    client_secret = os.environ[cfg["secret_env"]]
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(
                cfg["token_url"],
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "redirect_uri": _redirect_uri(provider),
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
    except httpx.HTTPError as e:
        raise OAuthError(f"token endpoint unreachable: {e}") from e
    if resp.status_code >= 400:
        raise OAuthError(f"token exchange failed: {resp.status_code} {resp.text[:200]}")
    data = resp.json()
    token = data.get("access_token")
    if not token:
        raise OAuthError(f"no access_token in response: {data}")
    return token

def fetch_profile(provider: str, access_token: str) -> dict[str, Any]:

    cfg = PROVIDERS[provider]
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(
                cfg["profile_url"],
                headers={"Authorization": f"Bearer {access_token}"},
            )
    except httpx.HTTPError as e:
        raise OAuthError(f"profile endpoint unreachable: {e}") from e
    if resp.status_code >= 400:
        raise OAuthError(f"profile fetch failed: {resp.status_code} {resp.text[:200]}")
    p = resp.json()

    if provider == "yandex":
        return {
            "subject": str(p.get("id") or p.get("uid") or ""),
            "email": (p.get("default_email") or (p.get("emails") or [None])[0] or "").lower() or None,
            "name": p.get("real_name") or p.get("display_name") or p.get("login") or "",
        }
    if provider == "vk":
        user = p.get("user") or p
        return {
            "subject": str(user.get("user_id") or user.get("id") or ""),
            "email": (user.get("email") or "").lower() or None,
            "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "Пользователь",
        }
    raise OAuthError(f"unknown provider: {provider}")

def find_or_create_user(db: Session, provider: str, profile: dict) -> User:

    from auth import hash_password

    subject = profile["subject"]
    email = profile.get("email")
    name = profile.get("name") or email or "Пользователь"

    u = (
        db.query(User)
        .filter(
            User.oauth_provider == provider,
            User.oauth_subject == subject,
        )
        .first()
    )
    if u:
        return u

    if email:
        u = db.query(User).filter(User.email == email).first()
        if u:
            u.oauth_provider = provider
            u.oauth_subject = subject
            u.email_verified = True
            db.commit()
            db.refresh(u)
            return u

    effective_email = email or f"{provider}-{subject}@oauth.local"
    u = User(
        email=effective_email,
        name=name[:200] or "Пользователь",
        phone="",
        hashed_password=hash_password(secrets.token_urlsafe(24)),
        email_verified=bool(email),
        oauth_provider=provider,
        oauth_subject=subject,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u
