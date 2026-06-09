import os
import secrets
import warnings
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import get_db
from models import User

def _load_secret() -> str:

    env = os.environ.get("JWT_SECRET_KEY", "").strip()
    if env:
        if len(env) < 32:
            raise RuntimeError("JWT_SECRET_KEY must be at least 32 characters")
        return env
    if os.environ.get("APP_ENV", "").lower() == "production":
        raise RuntimeError("JWT_SECRET_KEY environment variable is required in production")

    warnings.warn(
        "JWT_SECRET_KEY not set — using ephemeral random secret. All issued tokens will be invalidated on restart.",
        RuntimeWarning,
        stacklevel=2,
    )
    return secrets.token_urlsafe(48)

SECRET_KEY = _load_secret()
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

_BCRYPT_MAX_BYTES = 72

def _truncate_for_bcrypt(password: str) -> str:

    raw = password.encode("utf-8")
    if len(raw) > _BCRYPT_MAX_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Пароль слишком длинный (макс {_BCRYPT_MAX_BYTES} байт)",
        )
    return password

def hash_password(password: str) -> str:
    return pwd_context.hash(_truncate_for_bcrypt(password))

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(_truncate_for_bcrypt(plain), hashed)
    except HTTPException:
        return False

def create_access_token(user_id: int, token_version: int = 1) -> str:
    to_encode = {
        "sub": str(user_id),
        "tv": int(token_version),
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if token is None:
        return None
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
        sub = payload.get("sub")
        if sub is None:
            return None
        try:
            user_id = int(sub)
        except (TypeError, ValueError):
            return None
    except JWTError:
        return None
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        return None

    token_tv = payload.get("tv", 1)
    if int(token_tv) != int(user.token_version or 1):
        return None
    return user

def require_user(
    user: User | None = Depends(get_current_user),
) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Необходима авторизация",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def _admin_emails() -> set[str]:
    raw = os.environ.get("ADMIN_EMAILS", "")
    return {e.strip().lower() for e in raw.split(",") if e.strip()}

def is_admin(user: User) -> bool:
    return (user.email or "").lower() in _admin_emails()

def require_admin(user: User = Depends(require_user)) -> User:
    if not is_admin(user):
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return user
