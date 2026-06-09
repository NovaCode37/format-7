from __future__ import annotations
import json
import logging
import os
from typing import Any

from sqlalchemy.orm import Session
from models import PushSubscription

log = logging.getLogger("push")

def vapid_public_key() -> str:
    return os.environ.get("VAPID_PUBLIC_KEY", "").strip()

def vapid_configured() -> bool:
    return bool(vapid_public_key() and os.environ.get("VAPID_PRIVATE_KEY", "").strip())

def _claims() -> dict:
    return {"sub": f"mailto:{os.environ.get('VAPID_SUBJECT', 'admin@example.com')}"}

def send_to_subscription(sub: PushSubscription, payload: dict[str, Any]) -> bool:

    if not vapid_configured():
        return False
    try:
        from pywebpush import webpush, WebPushException
    except ImportError:
        log.warning("pywebpush not installed — skipping push send")
        return False

    subscription_info = {
        "endpoint": sub.endpoint,
        "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
    }
    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps(payload, ensure_ascii=False),
            vapid_private_key=os.environ["VAPID_PRIVATE_KEY"],
            vapid_claims=_claims(),
            ttl=86400,
        )
        return True
    except WebPushException as e:
        status = getattr(e.response, "status_code", None) if e.response is not None else None
        if status in (404, 410):
            return False
        log.warning("webpush failed (%s): %s", status, e)
        return False
    except Exception as e:
        log.warning("webpush error: %s", e)
        return False

def broadcast_to_user(db: Session, user_id: int, payload: dict[str, Any]) -> int:

    if not vapid_configured():
        return 0
    subs = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    delivered = 0
    to_delete = []
    for sub in subs:
        ok = send_to_subscription(sub, payload)
        if ok:
            delivered += 1
        else:
            pass
    for sub in to_delete:
        db.delete(sub)
    if to_delete:
        db.commit()
    return delivered
