from __future__ import annotations
import hashlib
import os
import logging

import httpx

log = logging.getLogger("security")

def is_password_compromised(password: str) -> bool:

    if os.environ.get("APP_ENV", "").lower() == "test":
        return False

    if not password:
        return False
    try:
        sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
        prefix, suffix = sha1[:5], sha1[5:]
        with httpx.Client(timeout=3.0) as client:
            resp = client.get(f"https://api.pwnedpasswords.com/range/{prefix}")
        if resp.status_code != 200:
            return False
        for line in resp.text.splitlines():
            h, _count = line.split(":", 1)
            if h.strip() == suffix:
                return True
        return False
    except Exception as e:
        log.warning("HIBP check failed: %s", e)
        return False

def verify_turnstile(token: str, remote_ip: str | None = None) -> bool:

    if os.environ.get("APP_ENV", "").lower() == "test":
        return True

    secret = os.environ.get("TURNSTILE_SECRET", "").strip()
    if not secret:
        return True
    if not token:
        return False
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.post(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                data={"secret": secret, "response": token, "remoteip": remote_ip or ""},
            )
        data = resp.json()
        return bool(data.get("success"))
    except Exception as e:
        log.warning("Turnstile verify failed: %s", e)

        return False
