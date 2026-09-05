from __future__ import annotations

import json
from typing import Any

from fastapi import Request
from sqlalchemy.orm import Session

from client_ip import get_client_ip
from models import AdminAudit, User


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
        ip=get_client_ip(request),
    )
    db.add(entry)
    db.commit()
