from __future__ import annotations
import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from models import AuthToken, User

def _hash(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()

def issue(db: Session, user: User, purpose: str, ttl_minutes: int) -> str:

    raw = secrets.token_urlsafe(32)
    rec = AuthToken(
        user_id=user.id,
        token_hash=_hash(raw),
        purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=ttl_minutes),
    )
    db.add(rec)
    db.commit()
    return raw

def consume(db: Session, raw: str, purpose: str, allow_reuse: bool = False) -> User | None:

    if not raw:
        return None
    rec = db.query(AuthToken).filter(AuthToken.token_hash == _hash(raw), AuthToken.purpose == purpose).first()
    if not rec:
        return None
    if rec.expires_at < datetime.utcnow():
        return None
    if rec.used_at is not None and not allow_reuse:
        return None
    user = db.query(User).filter(User.id == rec.user_id).first()
    if not user:
        return None
    if rec.used_at is None:
        rec.used_at = datetime.utcnow()
        db.commit()
    return user

def invalidate_pending(db: Session, user_id: int, purpose: str) -> None:

    db.query(AuthToken).filter(
        AuthToken.user_id == user_id,
        AuthToken.purpose == purpose,
        AuthToken.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()})
    db.commit()
