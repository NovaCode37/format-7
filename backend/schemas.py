from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
import re

_PHONE_RE = re.compile(r"^[+\d][\d\s\-()]{0,30}$")

class NavItemOut(BaseModel):
    id: int
    name: str
    slug: str
    order: int

    class Config:
        from_attributes = True

class ServiceOut(BaseModel):
    id: int
    name: str
    slug: str
    icon: str
    description: str
    category_id: int | None
    order: int

    class Config:
        from_attributes = True

class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    icon: str
    order: int
    services: list[ServiceOut] = []

    class Config:
        from_attributes = True

class TabProductOut(BaseModel):
    id: int
    name: str
    icon: str
    slug: str
    order: int

    class Config:
        from_attributes = True

class TabGroupOut(BaseModel):
    id: int
    name: str
    order: int
    products: list[TabProductOut] = []

    class Config:
        from_attributes = True

class SectionCardOut(BaseModel):
    id: int
    name: str
    icon: str
    slug: str
    button_text: str
    order: int

    class Config:
        from_attributes = True

class SectionBlockOut(BaseModel):
    id: int
    title: str
    slug: str
    order: int
    cards: list[SectionCardOut] = []

    class Config:
        from_attributes = True

class OfficeOut(BaseModel):
    id: int
    name: str
    address: str
    phone: str
    hours: str
    is_open: bool
    lat: str
    lng: str

    class Config:
        from_attributes = True

class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(default="", max_length=30)
    password: str = Field(min_length=8, max_length=72)
    turnstile_token: str | None = None

    website: str = Field(default="", max_length=200)

    @field_validator("phone")
    @classmethod
    def _phone_ok(cls, v: str) -> str:
        v = (v or "").strip()
        if v and not _PHONE_RE.match(v):
            raise ValueError("Некорректный номер телефона")
        return v

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=72)
    turnstile_token: str | None = None

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    phone: str
    is_admin: bool = False
    email_verified: bool = False

    class Config:
        from_attributes = True

class CartItemIn(BaseModel):
    service_id: int
    quantity: int = 1
    note: str = ""

class CartItemOut(BaseModel):
    id: int
    service_id: int
    quantity: int
    note: str
    service: ServiceOut

    class Config:
        from_attributes = True

class OrderItemIn(BaseModel):
    service_id: int = Field(ge=1)
    quantity: int = Field(default=1, ge=1, le=10000)
    price: float = Field(default=0, ge=0, le=10_000_000)
    options: dict = Field(default_factory=dict)

class OrderIn(BaseModel):
    customer_name: str = Field(min_length=1, max_length=200)
    customer_email: EmailStr
    customer_phone: str = Field(default="", max_length=30)
    comment: str = Field(default="", max_length=2000)
    items: list[OrderItemIn] = Field(default_factory=list, max_length=200)

    delivery_type: str = Field(default="pickup", pattern=r"^(pickup|delivery)$")
    delivery_address: str = Field(default="", max_length=500)
    office_id: int | None = None

    file_ids: list[int] = Field(default_factory=list, max_length=50)

class UploadedFileOut(BaseModel):
    id: int
    original_name: str
    content_type: str
    size: int
    created_at: datetime

    class Config:
        from_attributes = True

class OrderItemOut(BaseModel):
    id: int
    service_id: int
    quantity: int
    price: float
    options: str = ""
    service: ServiceOut

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_name: str
    customer_email: str
    customer_phone: str
    status: str
    total: float
    comment: str
    delivery_type: str
    delivery_address: str
    office_id: int | None = None
    payment_status: str = "pending"
    payment_method: str = "sbp"
    payment_token: str = ""
    paid_at: datetime | None = None
    created_at: datetime
    items: list[OrderItemOut] = []
    files: list[UploadedFileOut] = []

    class Config:
        from_attributes = True

class PaymentInfoOut(BaseModel):
    order_number: str
    total: float
    payment_status: str
    payment_method: str
    paid_at: datetime | None = None
    sbp_payload: str
    merchant_name: str

class PaymentInitOut(BaseModel):
    order_number: str
    provider: str
    confirmation_url: str | None = None
    provider_payment_id: str | None = None

class OrderStatusOut(BaseModel):
    order_number: str
    status: str
    created_at: datetime
    total: float

    class Config:
        from_attributes = True

class ProfileUpdateIn(BaseModel):
    name: str | None = None
    phone: str | None = None

class PasswordChangeIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=72)

class ForgotPasswordIn(BaseModel):
    email: EmailStr
    turnstile_token: str | None = None

class ResetPasswordIn(BaseModel):
    token: str = Field(min_length=16, max_length=80)
    new_password: str = Field(min_length=8, max_length=72)

class VerifyEmailIn(BaseModel):
    token: str = Field(min_length=16, max_length=80)

class RefundIn(BaseModel):
    amount: float = Field(gt=0, le=10_000_000)
    reason: str = Field(default="", max_length=500)

class RefundOut(BaseModel):
    id: int
    order_id: int
    amount: float
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class WishlistItemOut(BaseModel):
    id: int
    service_id: int
    service: ServiceOut
    created_at: datetime

    class Config:
        from_attributes = True

class WishlistAddIn(BaseModel):
    service_id: int = Field(ge=1)

class SavedAddressIn(BaseModel):
    label: str = Field(default="", max_length=50)
    address: str = Field(min_length=5, max_length=500)
    is_default: bool = False

class SavedAddressOut(BaseModel):
    id: int
    label: str
    address: str
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True

class PushSubscribeIn(BaseModel):
    endpoint: str = Field(min_length=10, max_length=500)
    p256dh: str = Field(min_length=10, max_length=200)
    auth: str = Field(min_length=5, max_length=100)
    user_agent: str = Field(default="", max_length=300)

class AdminAuditOut(BaseModel):
    id: int
    admin_email: str
    action: str
    target: str
    diff: str
    ip: str
    created_at: datetime

    class Config:
        from_attributes = True

class QuoteOptionIn(BaseModel):
    label: str
    value: str
    multiplier: float = 1.0

class QuoteIn(BaseModel):
    service_id: int
    base_price: float = Field(ge=0)
    quantity: int = Field(ge=1)
    options: list[QuoteOptionIn] = []

class QuoteOut(BaseModel):
    unit_price: float
    total_price: float
    quantity: int
    breakdown: list[dict]

class SubscribeIn(BaseModel):
    email: EmailStr

class SubscribeOut(BaseModel):
    id: int
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewIn(BaseModel):
    author_name: str = Field(min_length=1, max_length=200)
    rating: int = Field(ge=1, le=5, default=5)
    text: str = Field(min_length=1, max_length=5000)

class ReviewOut(BaseModel):
    id: int
    author_name: str
    rating: int
    text: str
    created_at: datetime

    class Config:
        from_attributes = True
