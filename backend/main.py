import hmac
import ipaddress
import json
import logging
import os
import re
import secrets
import uuid
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Header, Request, BackgroundTasks, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.datastructures import MutableHeaders
from sqlalchemy.orm import Session
from database import get_db, engine, Base
from models import (
    NavItem,
    TabGroup,
    SectionBlock,
    Service,
    Category,
    Office,
    User,
    CartItem,
    Order,
    OrderItem,
    Subscription,
    Review,
    UploadedFile,
)
from schemas import (
    NavItemOut,
    TabGroupOut,
    SectionBlockOut,
    ServiceOut,
    OfficeOut,
    RegisterIn,
    LoginIn,
    TokenOut,
    UserOut,
    CartItemIn,
    CartItemOut,
    OrderIn,
    OrderOut,
    OrderStatusOut,
    SubscribeIn,
    SubscribeOut,
    ReviewIn,
    ReviewOut,
    UploadedFileOut,
    ProfileUpdateIn,
    PasswordChangeIn,
    QuoteIn,
    QuoteOut,
    PaymentInfoOut,
)
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_user,
    require_admin,
    is_admin,
)
from sbp import build_payload, get_merchant
from rate_limit import make_limiter
from payments import (
    get_yookassa_client,
    provider_enabled,
    is_yookassa_ip,
    PaymentError,
)
from schemas import (
    PaymentInitOut,
    ForgotPasswordIn,
    ResetPasswordIn,
    VerifyEmailIn,
    RefundIn,
    RefundOut,
    AdminAuditOut,
    CategoryOut,
    ServiceAdminIn,
    CategoryAdminIn,
    OfficeAdminIn,
    WishlistItemOut,
    WishlistAddIn,
    SavedAddressIn,
    SavedAddressOut,
    PushSubscribeIn,
)
from notifications import (
    notify_new_order,
    notify_order_paid,
    notify_status_changed,
    notify_password_reset,
    notify_email_verification,
    notify_refund,
)
import tokens as auth_tokens
import idempotency
import audit
import storage
import scheduler as bg_scheduler
from security_checks import is_password_compromised, verify_turnstile
from models import (
    AuthToken,
    IdempotencyRecord,
    AdminAudit,
    Refund,
    WishlistItem,
    SavedAddress,
    PushSubscription,
)
import oauth as oauth_mod
import push as webpush
import datetime as _dt

logging.basicConfig(
    level=os.environ.get("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
log = logging.getLogger("format7")

_sentry_dsn = os.environ.get("SENTRY_DSN", "").strip()
if _sentry_dsn:
    try:
        import sentry_sdk

        sentry_sdk.init(
            dsn=_sentry_dsn,
            traces_sample_rate=float(os.environ.get("SENTRY_TRACES", "0.1")),
            environment=os.environ.get("APP_ENV", "development"),
        )
        log.info("sentry enabled")
    except Exception as e:
        log.warning("sentry init failed: %s", e)

Base.metadata.create_all(bind=engine)

def _auto_migrate():
    backend_name = engine.url.get_backend_name()
    if backend_name.startswith("postgresql"):
        with engine.connect() as conn:
            for sql in (
                "ALTER TABLE services ADD COLUMN IF NOT EXISTS image VARCHAR(500) DEFAULT ''",
                "ALTER TABLE services ADD COLUMN IF NOT EXISTS price_from INTEGER DEFAULT 0",
                "ALTER TABLE services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE NOT NULL",
                "ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION DEFAULT 0",
                "ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS options TEXT DEFAULT ''",
            ):
                conn.exec_driver_sql(sql)
            conn.commit()
        return
    if not backend_name.startswith("sqlite"):
        log.info("auto-migrate skipped (unknown backend); use alembic instead")
        return
    with engine.connect() as conn:
        from sqlalchemy import text

        def cols(table: str) -> set[str]:
            rows = conn.exec_driver_sql(f"PRAGMA table_info({table})").fetchall()
            return {r[1] for r in rows}

        existing = cols("orders")
        for sql in (
            "ALTER TABLE orders ADD COLUMN delivery_type VARCHAR(20) DEFAULT 'pickup'"
            if "delivery_type" not in existing
            else None,
            "ALTER TABLE orders ADD COLUMN delivery_address VARCHAR(500) DEFAULT ''"
            if "delivery_address" not in existing
            else None,
            "ALTER TABLE orders ADD COLUMN office_id INTEGER" if "office_id" not in existing else None,
            "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending'"
            if "payment_status" not in existing
            else None,
            "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(20) DEFAULT 'sbp'"
            if "payment_method" not in existing
            else None,
            "ALTER TABLE orders ADD COLUMN payment_token VARCHAR(64) DEFAULT ''"
            if "payment_token" not in existing
            else None,
            "ALTER TABLE orders ADD COLUMN payment_provider VARCHAR(30) DEFAULT ''"
            if "payment_provider" not in existing
            else None,
            "ALTER TABLE orders ADD COLUMN provider_payment_id VARCHAR(80) DEFAULT ''"
            if "provider_payment_id" not in existing
            else None,
            "ALTER TABLE orders ADD COLUMN paid_at DATETIME" if "paid_at" not in existing else None,
        ):
            if sql:
                conn.exec_driver_sql(sql)

        user_cols = cols("users")
        if "token_version" not in user_cols:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1 NOT NULL")
        if "email_verified" not in user_cols:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0 NOT NULL")
        if "oauth_provider" not in user_cols:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(30) DEFAULT ''")
        if "oauth_subject" not in user_cols:
            conn.exec_driver_sql("ALTER TABLE users ADD COLUMN oauth_subject VARCHAR(120) DEFAULT ''")

        if "options" not in cols("order_items"):
            conn.exec_driver_sql("ALTER TABLE order_items ADD COLUMN options TEXT DEFAULT ''")

        service_cols = cols("services")
        if "image" not in service_cols:
            conn.exec_driver_sql("ALTER TABLE services ADD COLUMN image VARCHAR(500) DEFAULT ''")
        if "price_from" not in service_cols:
            conn.exec_driver_sql("ALTER TABLE services ADD COLUMN price_from INTEGER DEFAULT 0")
        if "is_active" not in service_cols:
            conn.exec_driver_sql("ALTER TABLE services ADD COLUMN is_active BOOLEAN DEFAULT 1 NOT NULL")

        cart_cols = cols("cart_items")
        if "price" not in cart_cols:
            conn.exec_driver_sql("ALTER TABLE cart_items ADD COLUMN price FLOAT DEFAULT 0")
        if "options" not in cart_cols:
            conn.exec_driver_sql("ALTER TABLE cart_items ADD COLUMN options TEXT DEFAULT ''")
        conn.commit()

try:
    _auto_migrate()
except Exception as e:
    print(f"[migrate] warning: {e}")

UPLOADS_DIR = (Path(__file__).parent / "uploads").resolve()
UPLOADS_DIR.mkdir(exist_ok=True)
MAX_UPLOAD_SIZE = 30 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/tiff",
    "image/heic",
    "application/pdf",
    "application/postscript",
    "application/illustrator",
    "application/zip",
    "application/x-zip-compressed",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/octet-stream",
}

ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
    "tif",
    "tiff",
    "heic",
    "pdf",
    "ai",
    "eps",
    "psd",
    "cdr",
    "zip",
    "rar",
    "7z",
    "doc",
    "docx",
    "rtf",
    "txt",
}
EXT_RE = re.compile(r"^[a-z0-9]{1,8}$")

MAX_FILES_PER_USER = 200
MAX_FILES_PER_ANONYMOUS = 5

app = FastAPI(title="Format7 API", version="1.1.0")

class SecurityHeadersMiddleware:

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers.setdefault("X-Content-Type-Options", "nosniff")
                headers.setdefault("X-Frame-Options", "DENY")
                headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
                headers.setdefault("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
                if scope.get("scheme") == "https":
                    headers.setdefault(
                        "Strict-Transport-Security",
                        "max-age=63072000; includeSubDomains",
                    )
            await send(message)

        await self.app(scope, receive, send_wrapper)

app.add_middleware(SecurityHeadersMiddleware)

try:
    from prometheus_fastapi_instrumentator import Instrumentator

    Instrumentator(
        should_group_status_codes=True,
        excluded_handlers=["/metrics", "/health"],
    ).instrument(app).expose(app, include_in_schema=False, endpoint="/metrics")
except Exception as e:
    log.warning("prometheus instrumentator disabled: %s", e)

_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://frontend:3000",
]
_env_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
_allowed_origins = _env_origins or _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Payment-Token", "Idempotency-Key"],
)

login_limit = make_limiter(key="login", limit=10, window=60)
register_limit = make_limiter(key="register", limit=5, window=3600)
subscribe_limit = make_limiter(key="subscribe", limit=5, window=3600)
review_limit = make_limiter(key="review", limit=5, window=3600)
upload_limit = make_limiter(key="upload", limit=30, window=3600)
order_limit = make_limiter(key="order", limit=20, window=3600)
paid_limit = make_limiter(key="mark-paid", limit=20, window=3600)
forgot_limit = make_limiter(key="forgot", limit=5, window=3600)
refund_limit = make_limiter(key="refund", limit=30, window=3600)

@app.on_event("startup")
async def _on_startup():
    bg_scheduler.start()

@app.on_event("shutdown")
async def _on_shutdown():
    bg_scheduler.shutdown()

@app.get("/")
def root():
    return {"message": "Format7 API", "version": "1.0.0"}

@app.get("/health")
def healthcheck(db: Session = Depends(get_db)):

    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        return {"status": "ok", "db": "up"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"db down: {e}")

@app.get("/api/nav", response_model=list[NavItemOut])
def get_nav(db: Session = Depends(get_db)):
    return db.query(NavItem).order_by(NavItem.order).all()

@app.get("/api/tabs", response_model=list[TabGroupOut])
def get_tabs(db: Session = Depends(get_db)):
    return db.query(TabGroup).order_by(TabGroup.order).all()

@app.get("/api/sections", response_model=list[SectionBlockOut])
def get_sections(db: Session = Depends(get_db)):
    return db.query(SectionBlock).order_by(SectionBlock.order).all()

@app.get("/api/services", response_model=list[ServiceOut])
def get_services(db: Session = Depends(get_db)):
    return db.query(Service).filter(Service.is_active.is_(True)).order_by(Service.order).all()

@app.get("/api/categories", response_model=list[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    cats = db.query(Category).order_by(Category.order).all()
    for c in cats:
        c.services = [s for s in sorted(c.services, key=lambda x: x.order) if s.is_active]
    return cats

@app.get("/api/offices", response_model=list[OfficeOut])
def get_offices(db: Session = Depends(get_db)):
    return db.query(Office).all()

@app.get("/api/search", response_model=list[ServiceOut])
def search_services(q: str = "", db: Session = Depends(get_db)):

    q = (q or "").strip()
    if len(q) < 2:
        return []
    backend = engine.url.get_backend_name()

    if backend.startswith("postgres"):
        from sqlalchemy import text

        sql = text("""
            SELECT s.* FROM services s
            WHERE to_tsvector('russian', coalesce(s.name,'') || ' ' || coalesce(s.description,''))
                  @@ plainto_tsquery('russian', :q)
               OR s.name ILIKE :like
            ORDER BY s."order"
            LIMIT 20
        """)
        rows = db.execute(sql, {"q": q, "like": f"%{q}%"}).all()
        ids = [r[0] for r in rows]
        if not ids:
            return []
        return db.query(Service).filter(Service.id.in_(ids)).all()

    return db.query(Service).filter(Service.name.ilike(f"%{q}%")).order_by(Service.order).limit(20).all()

@app.post("/api/auth/register", response_model=TokenOut, dependencies=[Depends(register_limit)])
def register(
    data: RegisterIn,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):

    if data.website:
        log.info("register honeypot triggered from %s", request.client.host if request.client else "?")
        raise HTTPException(status_code=400, detail="Регистрация невозможна с этими данными")

    if not verify_turnstile(data.turnstile_token or "", remote_ip=request.client.host if request.client else None):
        raise HTTPException(status_code=400, detail="Не пройдена проверка CAPTCHA")

    if is_password_compromised(data.password):
        raise HTTPException(
            status_code=400,
            detail="Этот пароль засветился в известных утечках, выберите другой",
        )

    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Регистрация невозможна с этими данными")

    user = User(
        email=data.email,
        name=data.name,
        phone=data.phone,
        hashed_password=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    raw = auth_tokens.issue(db, user, purpose="email_verify", ttl_minutes=24 * 60)
    site = os.environ.get("PUBLIC_SITE_URL", "http://localhost:3000").rstrip("/")
    verify_url = f"{site}/verify-email?token={raw}"
    background.add_task(notify_email_verification, user, verify_url)

    token = create_access_token(user.id, user.token_version)
    return TokenOut(access_token=token)

@app.post("/api/auth/login", response_model=TokenOut, dependencies=[Depends(login_limit)])
def login(data: LoginIn, request: Request, db: Session = Depends(get_db)):
    if not verify_turnstile(data.turnstile_token or "", remote_ip=request.client.host if request.client else None):
        raise HTTPException(status_code=400, detail="Не пройдена проверка CAPTCHA")
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    token = create_access_token(user.id, user.token_version)
    return TokenOut(access_token=token)

@app.post("/api/auth/forgot-password", dependencies=[Depends(forgot_limit)])
def forgot_password(
    data: ForgotPasswordIn,
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):

    if not verify_turnstile(data.turnstile_token or "", remote_ip=request.client.host if request.client else None):
        raise HTTPException(status_code=400, detail="Не пройдена проверка CAPTCHA")

    user = db.query(User).filter(User.email == data.email).first()
    if user:
        auth_tokens.invalidate_pending(db, user.id, "password_reset")
        raw = auth_tokens.issue(db, user, purpose="password_reset", ttl_minutes=30)
        site = os.environ.get("PUBLIC_SITE_URL", "http://localhost:3000").rstrip("/")
        reset_url = f"{site}/reset-password?token={raw}"
        background.add_task(notify_password_reset, user, reset_url)

    return {"ok": True, "message": "Если такой email зарегистрирован, письмо отправлено"}

@app.post("/api/auth/reset-password", response_model=TokenOut)
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)):
    if is_password_compromised(data.new_password):
        raise HTTPException(
            status_code=400,
            detail="Пароль засветился в известных утечках, выберите другой",
        )
    user = auth_tokens.consume(db, data.token, purpose="password_reset")
    if not user:
        raise HTTPException(status_code=400, detail="Ссылка недействительна или устарела")
    user.hashed_password = hash_password(data.new_password)

    user.token_version = (user.token_version or 1) + 1
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id, user.token_version)
    return TokenOut(access_token=token)

@app.post("/api/auth/verify-email")
def verify_email(data: VerifyEmailIn, db: Session = Depends(get_db)):
    user = auth_tokens.consume(db, data.token, purpose="email_verify")
    if not user:
        raise HTTPException(status_code=400, detail="Ссылка недействительна или устарела")
    user.email_verified = True
    db.commit()
    return {"ok": True}

@app.post("/api/auth/resend-verification")
def resend_verification(
    request: Request,
    background: BackgroundTasks,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    if user.email_verified:
        return {"ok": True, "message": "Email уже подтверждён"}
    auth_tokens.invalidate_pending(db, user.id, "email_verify")
    raw = auth_tokens.issue(db, user, purpose="email_verify", ttl_minutes=24 * 60)
    site = os.environ.get("PUBLIC_SITE_URL", "http://localhost:3000").rstrip("/")
    background.add_task(notify_email_verification, user, f"{site}/verify-email?token={raw}")
    return {"ok": True}

@app.get("/api/auth/me", response_model=UserOut)
def get_me(user: User = Depends(require_user)):
    return UserOut(
        id=user.id,
        email=user.email,
        name=user.name,
        phone=user.phone or "",
        is_admin=is_admin(user),
        email_verified=bool(user.email_verified),
    )

_OAUTH_STATE_COOKIE = "f7_oauth_state"

@app.get("/api/auth/{provider}/authorize")
def oauth_authorize(provider: str):
    if not oauth_mod.provider_configured(provider):
        raise HTTPException(status_code=404, detail="Provider not configured")
    state = secrets.token_urlsafe(24)
    url = oauth_mod.build_authorize_url(provider, state)
    resp = RedirectResponse(url, status_code=302)

    resp.set_cookie(
        _OAUTH_STATE_COOKIE,
        state,
        max_age=600,
        httponly=True,
        samesite="lax",
        secure=os.environ.get("APP_ENV", "").lower() == "production",
    )
    return resp

@app.get("/api/auth/{provider}/callback")
def oauth_callback(
    provider: str,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    f7_oauth_state: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    site = os.environ.get("PUBLIC_SITE_URL", "http://localhost:3000").rstrip("/")
    if not oauth_mod.provider_configured(provider):
        raise HTTPException(status_code=404, detail="Provider not configured")
    if error:
        return RedirectResponse(f"{site}/login?oauth_error={error}", status_code=302)
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code/state")
    if not f7_oauth_state or not hmac.compare_digest(state, f7_oauth_state):
        raise HTTPException(status_code=400, detail="Invalid OAuth state")

    try:
        access = oauth_mod.exchange_code(provider, code)
        profile = oauth_mod.fetch_profile(provider, access)
    except oauth_mod.OAuthError as e:
        log.warning("oauth %s error: %s", provider, e)
        return RedirectResponse(f"{site}/login?oauth_error=exchange_failed", status_code=302)

    user = oauth_mod.find_or_create_user(db, provider, profile)
    auth_tokens.invalidate_pending(db, user.id, purpose="oauth_login")
    oauth_code = auth_tokens.issue(db, user, purpose="oauth_login", ttl_minutes=5)

    resp = RedirectResponse(f"{site}/oauth/callback?code={oauth_code}", status_code=302)
    resp.delete_cookie(_OAUTH_STATE_COOKIE)
    return resp

@app.post("/api/auth/oauth/exchange", response_model=TokenOut)
def oauth_exchange_token(data: dict, db: Session = Depends(get_db)):
    code = (data or {}).get("code", "")
    user = auth_tokens.consume(db, code, purpose="oauth_login")
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth code")
    token = create_access_token(user.id, user.token_version)
    return TokenOut(access_token=token)

@app.get("/api/wishlist", response_model=list[WishlistItemOut])
def wishlist_list(user: User = Depends(require_user), db: Session = Depends(get_db)):
    return db.query(WishlistItem).filter(WishlistItem.user_id == user.id).order_by(WishlistItem.created_at.desc()).all()

@app.post("/api/wishlist", response_model=WishlistItemOut)
def wishlist_add(
    data: WishlistAddIn,
    user: User = Depends(require_user),
    db: Session = Depends(get_db),
):
    svc = db.query(Service).filter(Service.id == data.service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Услуга не найдена")
    existing = (
        db.query(WishlistItem)
        .filter(
            WishlistItem.user_id == user.id,
            WishlistItem.service_id == data.service_id,
        )
        .first()
    )
    if existing:
        return existing
    item = WishlistItem(user_id=user.id, service_id=svc.id)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/wishlist/{item_id}")
def wishlist_remove(item_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    item = db.query(WishlistItem).filter(WishlistItem.id == item_id, WishlistItem.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Не найдено")
    db.delete(item)
    db.commit()
    return {"ok": True}

@app.get("/api/addresses", response_model=list[SavedAddressOut])
def addresses_list(user: User = Depends(require_user), db: Session = Depends(get_db)):
    return (
        db.query(SavedAddress)
        .filter(SavedAddress.user_id == user.id)
        .order_by(SavedAddress.is_default.desc(), SavedAddress.created_at.desc())
        .all()
    )

@app.post("/api/addresses", response_model=SavedAddressOut)
def addresses_add(data: SavedAddressIn, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if data.is_default:
        db.query(SavedAddress).filter(SavedAddress.user_id == user.id, SavedAddress.is_default == True).update(
            {"is_default": False}
        )
    addr = SavedAddress(user_id=user.id, label=data.label, address=data.address, is_default=data.is_default)
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return addr

@app.delete("/api/addresses/{addr_id}")
def addresses_remove(addr_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    addr = db.query(SavedAddress).filter(SavedAddress.id == addr_id, SavedAddress.user_id == user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Не найдено")
    db.delete(addr)
    db.commit()
    return {"ok": True}

@app.post("/api/addresses/{addr_id}/default", response_model=SavedAddressOut)
def addresses_set_default(addr_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    addr = db.query(SavedAddress).filter(SavedAddress.id == addr_id, SavedAddress.user_id == user.id).first()
    if not addr:
        raise HTTPException(status_code=404, detail="Не найдено")
    db.query(SavedAddress).filter(SavedAddress.user_id == user.id, SavedAddress.is_default == True).update(
        {"is_default": False}
    )
    addr.is_default = True
    db.commit()
    db.refresh(addr)
    return addr

@app.get("/api/push/vapid-public")
def push_vapid_public():

    return {"key": webpush.vapid_public_key()}

@app.post("/api/push/subscribe")
def push_subscribe(
    data: PushSubscribeIn,
    request: Request,
    user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(PushSubscription).filter(PushSubscription.endpoint == data.endpoint).first()
    if existing:
        existing.p256dh = data.p256dh
        existing.auth = data.auth
        existing.user_id = user.id if user else None
        existing.user_agent = data.user_agent
        db.commit()
        return {"ok": True, "id": existing.id}
    sub = PushSubscription(
        user_id=user.id if user else None,
        endpoint=data.endpoint,
        p256dh=data.p256dh,
        auth=data.auth,
        user_agent=data.user_agent or (request.headers.get("user-agent", "")[:300]),
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return {"ok": True, "id": sub.id}

@app.post("/api/push/unsubscribe")
def push_unsubscribe(
    data: dict,
    user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    endpoint = (data or {}).get("endpoint", "")
    if not endpoint:
        raise HTTPException(status_code=400, detail="Missing endpoint")
    q = db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint)
    if user:
        q = q.filter(PushSubscription.user_id == user.id)
    sub = q.first()
    if sub:
        db.delete(sub)
        db.commit()
    return {"ok": True}

@app.get("/api/cart", response_model=list[CartItemOut])
def get_cart(user: User = Depends(require_user), db: Session = Depends(get_db)):
    return db.query(CartItem).filter(CartItem.user_id == user.id).all()

@app.post("/api/cart", response_model=CartItemOut)
def add_to_cart(data: CartItemIn, user: User = Depends(require_user), db: Session = Depends(get_db)):
    sid = data.service_id
    service = db.query(Service).filter(Service.id == sid).first() if sid else None
    if service is None:
        service = db.query(Service).order_by(Service.id).first()
        if service is None:
            raise HTTPException(status_code=503, detail="Каталог услуг недоступен")
        sid = service.id
    item = CartItem(
        user_id=user.id,
        service_id=sid,
        quantity=data.quantity,
        note=data.note,
        price=max(data.price, 0),
        options=json.dumps(data.options, ensure_ascii=False) if data.options else "",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/cart/{item_id}")
def remove_from_cart(item_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    item = db.query(CartItem).filter(CartItem.id == item_id, CartItem.user_id == user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Элемент не найден")
    db.delete(item)
    db.commit()
    return {"ok": True}

@app.delete("/api/cart")
def clear_cart(user: User = Depends(require_user), db: Session = Depends(get_db)):
    db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    return {"ok": True}

@app.post("/api/orders", response_model=OrderOut, dependencies=[Depends(order_limit)])
def create_order(
    data: OrderIn,
    request: Request,
    background: BackgroundTasks,
    user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    cached = idempotency.check(db, request, scope="orders.create")
    if cached is not None:
        return cached

    if not data.items:
        raise HTTPException(status_code=400, detail="Нет товаров в заказе")

    fallback_service = db.query(Service).order_by(Service.id).first()
    if fallback_service is None:
        raise HTTPException(status_code=503, detail="Каталог услуг недоступен")
    requested_ids = {i.service_id for i in data.items if i.service_id and i.service_id >= 1}
    existing_ids = (
        {row[0] for row in db.query(Service.id).filter(Service.id.in_(requested_ids)).all()}
        if requested_ids else set()
    )

    def resolve_sid(sid: int) -> int:
        return sid if sid in existing_ids else fallback_service.id
    if data.delivery_type == "delivery" and not data.delivery_address.strip():
        raise HTTPException(status_code=400, detail="Укажите адрес доставки")
    if data.delivery_type == "pickup" and data.office_id:
        if not db.query(Office).filter(Office.id == data.office_id).first():
            raise HTTPException(status_code=400, detail="Офис не найден")

    order_number = "F7-" + secrets.token_hex(8).upper()
    total = sum(max(i.price, 0) * max(i.quantity, 1) for i in data.items)
    order = Order(
        order_number=order_number,
        user_id=user.id if user else None,
        customer_name=data.customer_name,
        customer_email=data.customer_email,
        customer_phone=data.customer_phone,
        comment=data.comment,
        total=total,
        delivery_type=data.delivery_type,
        delivery_address=data.delivery_address,
        office_id=data.office_id,
        payment_token=secrets.token_urlsafe(32),
    )
    db.add(order)
    db.flush()

    for item in data.items:
        db.add(
            OrderItem(
                order_id=order.id,
                service_id=resolve_sid(item.service_id),
                quantity=item.quantity,
                price=item.price,
                options=json.dumps(item.options, ensure_ascii=False) if item.options else "",
            )
        )

    if data.file_ids:
        q = db.query(UploadedFile).filter(UploadedFile.id.in_(data.file_ids), UploadedFile.order_id.is_(None))
        if user:
            q = q.filter((UploadedFile.user_id == user.id) | (UploadedFile.user_id.is_(None)))
        else:
            q = q.filter(UploadedFile.user_id.is_(None))
        for f in q.all():
            f.order_id = order.id

    if user:
        db.query(CartItem).filter(CartItem.user_id == user.id).delete()
    db.commit()
    db.refresh(order)

    background.add_task(notify_new_order, order)

    response = OrderOut.model_validate(order).model_dump(mode="json")
    idempotency.remember(db, request, scope="orders.create", response=response, user_id=user.id if user else None)
    return response

@app.get("/api/orders", response_model=list[OrderOut])
def get_my_orders(user: User = Depends(require_user), db: Session = Depends(get_db)):
    return db.query(Order).filter(Order.user_id == user.id).order_by(Order.created_at.desc()).all()

@app.get("/api/orders/status/{order_number}", response_model=OrderStatusOut)
def check_order_status(order_number: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order

@app.get("/api/orders/{order_number}", response_model=OrderOut)
def get_order_details(order_number: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_number == order_number, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order

@app.post("/api/orders/{order_number}/repeat")
def repeat_order(order_number: str, user: User = Depends(require_user), db: Session = Depends(get_db)):

    order = db.query(Order).filter(Order.order_number == order_number, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    added = 0
    for item in order.items:
        svc = db.query(Service).filter(Service.id == item.service_id).first()
        if not svc:
            continue
        existing = db.query(CartItem).filter(CartItem.user_id == user.id, CartItem.service_id == svc.id).first()
        if existing:
            existing.quantity += item.quantity
        else:
            db.add(CartItem(user_id=user.id, service_id=svc.id, quantity=item.quantity))
        added += 1
    db.commit()
    return {"ok": True, "added": added}

@app.post("/api/orders/{order_number}/cancel", response_model=OrderOut)
def cancel_order(order_number: str, user: User = Depends(require_user), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_number == order_number, Order.user_id == user.id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if order.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail=f"Заказ уже в статусе «{order.status}»")
    if order.status == "ready":
        raise HTTPException(status_code=400, detail="Нельзя отменить готовый заказ — свяжитесь с офисом")
    order.status = "cancelled"
    db.commit()
    db.refresh(order)
    return order

def _build_payment_info(order: Order) -> PaymentInfoOut:
    total_kop = max(int(round(float(order.total or 0) * 100)), 0)
    payload = build_payload(order.order_number, total_kop)
    merchant = get_merchant()
    return PaymentInfoOut(
        order_number=order.order_number,
        total=order.total,
        payment_status=order.payment_status or "pending",
        payment_method=order.payment_method or "sbp",
        paid_at=order.paid_at,
        sbp_payload=payload,
        merchant_name=merchant["name"],
    )

@app.get("/api/orders/{order_number}/payment", response_model=PaymentInfoOut)
def get_payment_info(order_number: str, db: Session = Depends(get_db)):

    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return _build_payment_info(order)

ENABLE_DEV_PAYMENT = os.environ.get("ENABLE_DEV_PAYMENT", "0") == "1"

@app.post("/api/orders/{order_number}/mark-paid", response_model=PaymentInfoOut, dependencies=[Depends(paid_limit)])
def mark_order_paid(
    order_number: str,
    background: BackgroundTasks,
    x_payment_token: str | None = Header(default=None, alias="X-Payment-Token"),
    db: Session = Depends(get_db),
):

    if not ENABLE_DEV_PAYMENT:
        raise HTTPException(status_code=404, detail="Not Found")

    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    expected = (order.payment_token or "").strip()
    provided = (x_payment_token or "").strip()
    if not expected or not provided or not hmac.compare_digest(expected, provided):
        raise HTTPException(status_code=403, detail="Invalid payment token")

    if order.payment_status != "paid":
        order.payment_status = "paid"
        order.paid_at = _dt.datetime.utcnow()
        if order.status == "new":
            order.status = "paid"
        db.commit()
        db.refresh(order)
        background.add_task(notify_order_paid, order)
    return _build_payment_info(order)

pay_init_limit = make_limiter(key="pay-init", limit=20, window=3600)
webhook_limit = make_limiter(key="pay-webhook", limit=200, window=60)

def _trusted_proxy_networks() -> list[ipaddress.IPv4Network | ipaddress.IPv6Network]:
    raw = os.environ.get("TRUSTED_PROXY_CIDRS", "127.0.0.1/32,::1/128")
    networks: list[ipaddress.IPv4Network | ipaddress.IPv6Network] = []
    for part in (raw or "").split(","):
        cidr = part.strip()
        if not cidr:
            continue
        try:
            networks.append(ipaddress.ip_network(cidr, strict=False))
        except ValueError:
            log.warning("invalid TRUSTED_PROXY_CIDRS entry: %s", cidr)
    return networks

def _is_trusted_proxy(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(addr in net for net in _trusted_proxy_networks())

def _get_forwarded_ip(request: Request) -> str:
    client_ip = request.client.host if request.client else ""
    if not client_ip:
        return ""

    if not _is_trusted_proxy(client_ip):
        return client_ip

    fwd = request.headers.get("x-forwarded-for", "")
    if not fwd:
        return client_ip

    real_ip = fwd.split(",")[0].strip()
    return real_ip or client_ip

@app.post("/api/orders/{order_number}/pay/init", response_model=PaymentInitOut, dependencies=[Depends(pay_init_limit)])
def pay_init(
    order_number: str,
    x_payment_token: str | None = Header(default=None, alias="X-Payment-Token"),
    db: Session = Depends(get_db),
):

    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    expected = (order.payment_token or "").strip()
    provided = (x_payment_token or "").strip()
    if not expected or not provided or not hmac.compare_digest(expected, provided):
        raise HTTPException(status_code=404, detail="Заказ не найден")

    if order.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Заказ уже оплачен")

    provider = provider_enabled()

    if provider == "yookassa":
        client = get_yookassa_client()
        if client is None:
            raise HTTPException(status_code=503, detail="Платёжный провайдер не настроен")

        if (order.payment_provider or "") == "yookassa" and (order.provider_payment_id or ""):
            try:
                existing = client.get_payment(order.provider_payment_id)
                existing_status = existing.get("status")
                if existing_status == "succeeded" and order.payment_status != "paid":
                    order.payment_status = "paid"
                    order.paid_at = _dt.datetime.utcnow()
                    if order.status == "new":
                        order.status = "paid"
                    db.commit()

                if existing_status in ("pending", "waiting_for_capture", "succeeded"):
                    confirmation_url = (existing.get("confirmation") or {}).get("confirmation_url")
                    return PaymentInitOut(
                        order_number=order.order_number,
                        provider="yookassa",
                        confirmation_url=confirmation_url,
                        provider_payment_id=order.provider_payment_id,
                    )

                if existing_status in ("canceled", "failed"):
                    order.provider_payment_id = ""
                    db.commit()
            except PaymentError as e:
                raise HTTPException(status_code=502, detail=f"Ошибка провайдера: {e}")

        public_url = os.environ.get("PUBLIC_SITE_URL", "http://localhost:3000").rstrip("/")
        return_url = f"{public_url}/orders/{order.order_number}/pay?done=1"

        receipt = None
        if os.environ.get("YOOKASSA_SEND_RECEIPT", "0") == "1":
            total_q = max(sum(i.quantity for i in order.items), 1)

            receipt = client._build_receipt(
                customer_email=order.customer_email,
                items=[
                    {
                        "description": f"Заказ {order.order_number}",
                        "amount_rub": round(float(order.total) / total_q, 2),
                        "quantity": total_q,
                    }
                ],
            )
        try:
            payment = client.create_payment(
                amount_rub=float(order.total or 0),
                description=f"Заказ {order.order_number}",
                return_url=return_url,
                metadata={"order_number": order.order_number},
                receipt=receipt,
            )
        except PaymentError as e:
            raise HTTPException(status_code=502, detail=f"Ошибка провайдера: {e}")

        order.payment_provider = "yookassa"
        order.provider_payment_id = str(payment.get("id", ""))
        db.commit()

        confirmation_url = (payment.get("confirmation") or {}).get("confirmation_url")
        return PaymentInitOut(
            order_number=order.order_number,
            provider="yookassa",
            confirmation_url=confirmation_url,
            provider_payment_id=order.provider_payment_id,
        )

    return PaymentInitOut(order_number=order.order_number, provider="none")

@app.post("/api/payments/webhook/yookassa", dependencies=[Depends(webhook_limit)])
async def yookassa_webhook(
    request: Request,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):

    src_ip = _get_forwarded_ip(request)
    if os.environ.get("APP_ENV", "").lower() == "production":
        if not is_yookassa_ip(src_ip):
            raise HTTPException(status_code=403, detail="Forbidden")

    try:
        event = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Malformed JSON")

    payment_id = ((event or {}).get("object") or {}).get("id")
    if not payment_id or not isinstance(payment_id, str):
        raise HTTPException(status_code=400, detail="Missing payment id")

    client = get_yookassa_client()
    if client is None:
        raise HTTPException(status_code=503, detail="Provider not configured")
    try:
        payment = client.get_payment(payment_id)
    except PaymentError as e:
        raise HTTPException(status_code=502, detail=str(e))

    order = (
        db.query(Order)
        .filter(
            Order.provider_payment_id == payment_id,
            Order.payment_provider == "yookassa",
        )
        .first()
    )
    if not order:
        return {"ok": True, "note": "unknown payment"}

    status_ = payment.get("status")

    paid_value = float((payment.get("amount") or {}).get("value", "0") or 0)
    if abs(paid_value - float(order.total or 0)) > 0.01:
        return {"ok": True, "note": "amount mismatch"}

    if status_ == "succeeded" and order.payment_status != "paid":
        order.payment_status = "paid"
        order.paid_at = _dt.datetime.utcnow()
        if order.status == "new":
            order.status = "paid"
        db.commit()
        db.refresh(order)
        background.add_task(notify_order_paid, order)
    elif status_ in ("canceled", "failed") and order.payment_status != "paid":
        order.payment_status = "failed"
        db.commit()

    return {"ok": True}

ALLOWED_STATUSES = {"new", "paid", "processing", "ready", "completed", "cancelled"}

@app.get("/api/admin/orders", response_model=list[OrderOut])
def admin_list_orders(
    status: str | None = None,
    q: str | None = None,
    limit: int = 100,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.status == status)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Order.order_number.ilike(like))
            | (Order.customer_name.ilike(like))
            | (Order.customer_email.ilike(like))
            | (Order.customer_phone.ilike(like))
        )
    return query.order_by(Order.created_at.desc()).limit(min(limit, 500)).all()

@app.patch("/api/admin/orders/{order_number}/status", response_model=OrderOut)
def admin_update_status(
    order_number: str,
    payload: dict,
    request: Request,
    background: BackgroundTasks,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    new_status = (payload or {}).get("status", "").strip().lower()
    if new_status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail="Недопустимый статус")
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if order.status == new_status:
        return order
    old_status = order.status
    order.status = new_status
    db.commit()
    db.refresh(order)
    audit.record(
        db,
        admin=admin,
        action="order.status_changed",
        target=order.order_number,
        diff={"from": old_status, "to": new_status},
        request=request,
    )
    background.add_task(notify_status_changed, order, new_status)
    return order

@app.post("/api/admin/orders/{order_number}/refund", response_model=RefundOut, dependencies=[Depends(refund_limit)])
def admin_refund(
    order_number: str,
    data: RefundIn,
    request: Request,
    background: BackgroundTasks,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):

    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if order.payment_status != "paid":
        raise HTTPException(status_code=400, detail="Заказ не оплачен — нечего возвращать")

    already = sum(
        r.amount for r in db.query(Refund).filter(Refund.order_id == order.id, Refund.status == "succeeded").all()
    )
    if data.amount + already > order.total + 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Сумма возвратов превышает сумму заказа ({already:.2f} + {data.amount:.2f} > {order.total:.2f})",
        )

    refund = Refund(
        order_id=order.id,
        amount=data.amount,
        reason=data.reason,
        provider=order.payment_provider or "",
        created_by=admin.id,
        status="pending",
    )
    db.add(refund)
    db.flush()

    if order.payment_provider == "yookassa" and order.provider_payment_id:
        client = get_yookassa_client()
        if client is None:
            refund.status = "failed"
            db.commit()
            raise HTTPException(status_code=503, detail="Провайдер не настроен")
        try:
            resp = client.create_refund(
                payment_id=order.provider_payment_id,
                amount_rub=data.amount,
                description=data.reason,
            )
            refund.provider_refund_id = str(resp.get("id", ""))
            refund.status = "succeeded" if resp.get("status") == "succeeded" else "pending"
        except PaymentError as e:
            refund.status = "failed"
            db.commit()
            raise HTTPException(status_code=502, detail=f"Возврат отклонён: {e}")

    total_refunded = already + (data.amount if refund.status == "succeeded" else 0)
    if total_refunded >= order.total - 0.01:
        order.status = "cancelled"

    db.commit()
    db.refresh(refund)

    audit.record(
        db,
        admin=admin,
        action="refund.issued",
        target=order.order_number,
        diff={"amount": data.amount, "reason": data.reason, "status": refund.status},
        request=request,
    )
    background.add_task(notify_refund, order, data.amount)
    return refund

@app.get("/api/admin/audit", response_model=list[AdminAuditOut])
def admin_audit_log(
    limit: int = 100,
    _: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return db.query(AdminAudit).order_by(AdminAudit.created_at.desc()).limit(min(limit, 500)).all()

@app.get("/api/admin/stats")
def admin_stats(_: User = Depends(require_admin), db: Session = Depends(get_db)):

    from sqlalchemy import func

    total_orders = db.query(func.count(Order.id)).scalar() or 0
    paid_orders = db.query(func.count(Order.id)).filter(Order.payment_status == "paid").scalar() or 0
    revenue = db.query(func.coalesce(func.sum(Order.total), 0)).filter(Order.payment_status == "paid").scalar() or 0
    by_status = dict(db.query(Order.status, func.count(Order.id)).group_by(Order.status).all())
    return {
        "total_orders": int(total_orders),
        "paid_orders": int(paid_orders),
        "revenue": float(revenue),
        "by_status": {k: int(v) for k, v in by_status.items()},
    }

_IMAGE_EXT = {
    "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
    "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg",
}
_IMAGE_MEDIA = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "webp": "image/webp", "gif": "image/gif", "svg": "image/svg+xml",
}

@app.post("/api/admin/upload-image")
async def admin_upload_image(file: UploadFile = File(...), _: User = Depends(require_admin)):
    ct = (file.content_type or "").lower()
    ext = _IMAGE_EXT.get(ct)
    if not ext:
        raise HTTPException(status_code=400, detail="Только изображения: JPG, PNG, WEBP, GIF, SVG")
    data = await file.read()
    if len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Файл больше 8 МБ")
    stored_name = f"img_{uuid.uuid4().hex}.{ext}"
    storage.save(stored_name, data, ct)
    return {"url": f"/api/images/{stored_name}"}

@app.get("/api/images/{name}")
def serve_image(name: str):
    if "/" in name or "\\" in name or ".." in name:
        raise HTTPException(status_code=404, detail="Не найдено")
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    media = _IMAGE_MEDIA.get(ext, "application/octet-stream")
    stream = storage.open_stream(name)
    if stream is None:
        raise HTTPException(status_code=404, detail="Не найдено")
    from fastapi.responses import StreamingResponse

    def _iter():
        try:
            while True:
                chunk = stream.read(65536)
                if not chunk:
                    break
                yield chunk
        finally:
            try:
                stream.close()
            except Exception:
                pass

    return StreamingResponse(_iter(), media_type=media, headers={"Cache-Control": "public, max-age=86400"})

@app.get("/api/admin/categories", response_model=list[CategoryOut])
def admin_list_categories(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.order).all()

@app.post("/api/admin/categories", response_model=CategoryOut)
def admin_create_category(data: CategoryAdminIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if db.query(Category).filter(Category.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="Категория с таким slug уже существует")
    c = Category(**data.model_dump())
    db.add(c); db.commit(); db.refresh(c)
    return c

@app.patch("/api/admin/categories/{cat_id}", response_model=CategoryOut)
def admin_update_category(cat_id: int, data: CategoryAdminIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    c = db.query(Category).filter(Category.id == cat_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    dup = db.query(Category).filter(Category.slug == data.slug, Category.id != cat_id).first()
    if dup:
        raise HTTPException(status_code=400, detail="Категория с таким slug уже существует")
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    db.commit(); db.refresh(c)
    return c

@app.delete("/api/admin/categories/{cat_id}")
def admin_delete_category(cat_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    c = db.query(Category).filter(Category.id == cat_id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    db.query(Service).filter(Service.category_id == cat_id).update({Service.category_id: None})
    db.delete(c); db.commit()
    return {"ok": True}

@app.get("/api/admin/services", response_model=list[ServiceOut])
def admin_list_services(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Service).order_by(Service.order, Service.id).all()

@app.post("/api/admin/services", response_model=ServiceOut)
def admin_create_service(data: ServiceAdminIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if db.query(Service).filter(Service.slug == data.slug).first():
        raise HTTPException(status_code=400, detail="Товар с таким slug уже существует")
    s = Service(**data.model_dump())
    db.add(s); db.commit(); db.refresh(s)
    return s

@app.patch("/api/admin/services/{sid}", response_model=ServiceOut)
def admin_update_service(sid: int, data: ServiceAdminIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    s = db.query(Service).filter(Service.id == sid).first()
    if not s:
        raise HTTPException(status_code=404, detail="Товар не найден")
    dup = db.query(Service).filter(Service.slug == data.slug, Service.id != sid).first()
    if dup:
        raise HTTPException(status_code=400, detail="Товар с таким slug уже существует")
    for k, v in data.model_dump().items():
        setattr(s, k, v)
    db.commit(); db.refresh(s)
    return s

@app.delete("/api/admin/services/{sid}")
def admin_delete_service(sid: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    s = db.query(Service).filter(Service.id == sid).first()
    if not s:
        raise HTTPException(status_code=404, detail="Товар не найден")
    has_orders = db.query(OrderItem.id).filter(OrderItem.service_id == sid).first() is not None
    db.query(CartItem).filter(CartItem.service_id == sid).delete()
    if has_orders:
        s.is_active = False
        db.commit()
        return {"ok": True, "soft": True}
    db.delete(s); db.commit()
    return {"ok": True, "soft": False}

@app.get("/api/admin/offices", response_model=list[OfficeOut])
def admin_list_offices(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Office).order_by(Office.id).all()

@app.post("/api/admin/offices", response_model=OfficeOut)
def admin_create_office(data: OfficeAdminIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    o = Office(**data.model_dump())
    db.add(o); db.commit(); db.refresh(o)
    return o

@app.patch("/api/admin/offices/{oid}", response_model=OfficeOut)
def admin_update_office(oid: int, data: OfficeAdminIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    o = db.query(Office).filter(Office.id == oid).first()
    if not o:
        raise HTTPException(status_code=404, detail="Офис не найден")
    for k, v in data.model_dump().items():
        setattr(o, k, v)
    db.commit(); db.refresh(o)
    return o

@app.delete("/api/admin/offices/{oid}")
def admin_delete_office(oid: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    o = db.query(Office).filter(Office.id == oid).first()
    if not o:
        raise HTTPException(status_code=404, detail="Офис не найден")
    db.delete(o); db.commit()
    return {"ok": True}

@app.get("/api/admin/reviews", response_model=list[ReviewOut])
def admin_list_reviews(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.created_at.desc()).all()

@app.delete("/api/admin/reviews/{rid}")
def admin_delete_review(rid: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    r = db.query(Review).filter(Review.id == rid).first()
    if not r:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    db.delete(r); db.commit()
    return {"ok": True}

@app.post("/api/subscribe", response_model=SubscribeOut, dependencies=[Depends(subscribe_limit)])
def subscribe(data: SubscribeIn, db: Session = Depends(get_db)):
    existing = db.query(Subscription).filter(Subscription.email == data.email).first()
    if existing:
        return existing
    sub = Subscription(email=data.email)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return sub

@app.get("/api/reviews", response_model=list[ReviewOut])
def get_reviews(db: Session = Depends(get_db)):
    return db.query(Review).order_by(Review.created_at.desc()).limit(50).all()

@app.post("/api/reviews", response_model=ReviewOut, dependencies=[Depends(review_limit)])
def create_review(data: ReviewIn, user: User | None = Depends(get_current_user), db: Session = Depends(get_db)):
    review = Review(
        user_id=user.id if user else None,
        author_name=data.author_name,
        rating=data.rating,
        text=data.text,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review

@app.patch("/api/auth/me", response_model=UserOut)
def update_profile(data: ProfileUpdateIn, user: User = Depends(require_user), db: Session = Depends(get_db)):
    if data.name is not None:
        name = data.name.strip()
        if len(name) < 2:
            raise HTTPException(status_code=400, detail="Имя должно быть не короче 2 символов")
        user.name = name
    if data.phone is not None:
        user.phone = data.phone.strip()
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/auth/change-password")
def change_password(data: PasswordChangeIn, user: User = Depends(require_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user.id).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Необходима авторизация")
    if not verify_password(data.current_password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Текущий пароль неверный")
    if data.current_password == data.new_password:
        raise HTTPException(status_code=400, detail="Новый пароль не должен совпадать с текущим")
    db_user.hashed_password = hash_password(data.new_password)

    db_user.token_version = (db_user.token_version or 1) + 1
    db.commit()
    new_token = create_access_token(db_user.id, db_user.token_version)
    return {"ok": True, "access_token": new_token}

@app.post("/api/auth/logout-all")
def logout_everywhere(user: User = Depends(require_user), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user.id).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Необходима авторизация")
    db_user.token_version = (db_user.token_version or 1) + 1
    db.commit()
    return {"ok": True}

def _safe_extension(filename: str | None) -> str:

    if not filename or "." not in filename:
        return ""
    raw = filename.rsplit(".", 1)[-1].lower().strip()
    if not EXT_RE.match(raw):
        return ""
    if raw not in ALLOWED_EXTENSIONS:
        return ""
    return raw

def _sanitize_original_name(name: str | None) -> str:

    if not name:
        return "file"

    name = os.path.basename(name).strip()
    name = re.sub(r"[\x00-\x1f\x7f]", "", name)
    return name[:200] or "file"

@app.post("/api/uploads", response_model=UploadedFileOut, dependencies=[Depends(upload_limit)])
async def upload_file(
    file: UploadFile = File(...),
    user: User | None = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail="Неподдерживаемый тип файла")

    chunks = []
    total = 0
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Файл слишком большой (макс {MAX_UPLOAD_SIZE // (1024 * 1024)} MB)",
            )
        chunks.append(chunk)
    content = b"".join(chunks)
    if total == 0:
        raise HTTPException(status_code=400, detail="Пустой файл")

    if user:
        existing_count = db.query(UploadedFile).filter(UploadedFile.user_id == user.id).count()
        if existing_count >= MAX_FILES_PER_USER:
            raise HTTPException(status_code=429, detail="Превышен лимит файлов")

    ext = _safe_extension(file.filename)
    stored = uuid.uuid4().hex + (f".{ext}" if ext else ".bin")
    try:
        storage.save(stored, content, content_type=file.content_type or "application/octet-stream")
    except ValueError:
        raise HTTPException(status_code=400, detail="Некорректное имя файла")

    uf = UploadedFile(
        user_id=user.id if user else None,
        original_name=_sanitize_original_name(file.filename),
        stored_name=stored,
        content_type=file.content_type or "application/octet-stream",
        size=total,
    )
    db.add(uf)
    db.commit()
    db.refresh(uf)
    return uf

@app.get("/api/uploads/{file_id}")
def download_file(file_id: int, user: User | None = Depends(get_current_user), db: Session = Depends(get_db)):
    uf = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if not uf:
        raise HTTPException(status_code=404, detail="Файл не найден")

    if uf.user_id:
        if not user or user.id != uf.user_id:
            raise HTTPException(status_code=403, detail="Нет доступа к файлу")
    else:
        if uf.order_id:
            raise HTTPException(status_code=403, detail="Нет доступа к файлу")

    from fastapi.responses import StreamingResponse

    stream = storage.open_stream(uf.stored_name)
    if stream is None:
        raise HTTPException(status_code=410, detail="Файл удалён с диска")

    headers = {
        "Content-Disposition": f'attachment; filename="{uf.original_name}"',
        "X-Content-Type-Options": "nosniff",
    }

    def _iter():
        try:
            if hasattr(stream, "iter_chunks"):
                yield from stream.iter_chunks(chunk_size=65536)
            else:
                while True:
                    chunk = stream.read(65536)
                    if not chunk:
                        break
                    yield chunk
        finally:
            try:
                stream.close()
            except Exception:
                pass

    return StreamingResponse(_iter(), media_type="application/octet-stream", headers=headers)

@app.delete("/api/uploads/{file_id}")
def delete_file(file_id: int, user: User = Depends(require_user), db: Session = Depends(get_db)):
    uf = db.query(UploadedFile).filter(UploadedFile.id == file_id, UploadedFile.user_id == user.id).first()
    if not uf:
        raise HTTPException(status_code=404, detail="Файл не найден")
    if uf.order_id:
        raise HTTPException(status_code=400, detail="Нельзя удалить файл, прикреплённый к заказу")
    storage.delete(uf.stored_name)
    db.delete(uf)
    db.commit()
    return {"ok": True}

@app.post("/api/calculator/quote", response_model=QuoteOut)
def calculate_quote(data: QuoteIn, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == data.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Услуга не найдена")

    unit = float(data.base_price)
    breakdown = [{"label": "Базовая цена", "value": service.name, "multiplier": 1.0, "running": unit}]
    for opt in data.options:
        m = max(0.0, float(opt.multiplier))
        unit *= m
        breakdown.append(
            {
                "label": opt.label,
                "value": opt.value,
                "multiplier": m,
                "running": round(unit, 2),
            }
        )
    unit = round(unit, 2)
    total = round(unit * data.quantity, 2)
    return QuoteOut(unit_price=unit, total_price=total, quantity=data.quantity, breakdown=breakdown)
