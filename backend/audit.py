from __future__ import annotations
import json
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from models import AdminAudit, User

def _client_ip(request: Request | None) -> str:
    if not request:
        return ""
    fwd = request.headers.get("x-forwarded-for") if request.headers else None
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else ""

def record(
    db: Session,
    *,
    admin: User,
    action: str,
    target: str = "",
    diff: dict[str, Any] | None = None,
    request: Request | None = None,
) -> None:
    entry = AdminAudit(
        admin_id=admin.id,
        admin_email=admin.email,
        action=action,
        target=target,
        diff=json.dumps(diff, ensure_ascii=False) if diff else "",
        ip=_client_ip(request),
    )
    db.add(entry)
    db.commit()
