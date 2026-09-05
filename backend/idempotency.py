from __future__ import annotations

import json
import re
from typing import Any

from fastapi import HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from models import IdempotencyRecord

_KEY_RE = re.compile(r"^[A-Za-z0-9._\-]{8,80}$")

def _extract_key(request: Request) -> str | None:
    key = request.headers.get("Idempotency-Key")
    if not key:
        return None
    key = key.strip()
    if not _KEY_RE.match(key):
        raise HTTPException(status_code=400, detail="Invalid Idempotency-Key")
    return key

def check(db: Session, request: Request, *, scope: str, user_id: int | None = None) -> dict | None:

    key = _extract_key(request)
    if not key:
        return None
    q = db.query(IdempotencyRecord).filter(IdempotencyRecord.key == key, IdempotencyRecord.scope == scope)
    if user_id is None:
        q = q.filter(IdempotencyRecord.user_id.is_(None))
    else:
        q = q.filter(IdempotencyRecord.user_id == user_id)
    rec = q.first()
    if rec is None:
        return None
    try:
        return json.loads(rec.response_json)
    except Exception:
        return None

def remember(
    db: Session,
    request: Request,
    *,
    scope: str,
    response: Any,
    user_id: int | None = None,
    status_code: int = 200,
) -> Any:

    key = _extract_key(request)
    if not key:
        return response
    try:
        rec = IdempotencyRecord(
            key=key,
            scope=scope,
            user_id=user_id,
            response_json=json.dumps(response, ensure_ascii=False, default=str),
            status_code=status_code,
        )
        db.add(rec)
        db.commit()
    except IntegrityError:
        db.rollback()
    return response
