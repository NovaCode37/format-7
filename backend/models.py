from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False)
    icon = Column(String(10), default="")
    order = Column(Integer, default=0)

    services = relationship("Service", back_populates="category")

class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False)
    icon = Column(String(10), default="")
    description = Column(Text, default="")
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    order = Column(Integer, default=0)
    image = Column(String(500), default="")
    price_from = Column(Integer, default=0)
    is_active = Column(Boolean, default=True, nullable=False)

    category = relationship("Category", back_populates="services")

class NavItem(Base):
    __tablename__ = "nav_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False)
    order = Column(Integer, default=0)

class TabGroup(Base):
    __tablename__ = "tab_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    order = Column(Integer, default=0)

    products = relationship("TabProduct", back_populates="tab_group")

class TabProduct(Base):
    __tablename__ = "tab_products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    icon = Column(String(10), default="")
    slug = Column(String(200), nullable=False)
    tab_group_id = Column(Integer, ForeignKey("tab_groups.id"))
    order = Column(Integer, default=0)

    tab_group = relationship("TabGroup", back_populates="products")

class SectionBlock(Base):
    __tablename__ = "section_blocks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(200), nullable=False)
    order = Column(Integer, default=0)

    cards = relationship("SectionCard", back_populates="section")

class SectionCard(Base):
    __tablename__ = "section_cards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    icon = Column(String(10), default="")
    slug = Column(String(200), nullable=False)
    button_text = Column(String(100), default="Заказать")
    section_id = Column(Integer, ForeignKey("section_blocks.id"))
    order = Column(Integer, default=0)

    section = relationship("SectionBlock", back_populates="cards")

class Office(Base):
    __tablename__ = "offices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(300), nullable=False)
    address = Column(String(500), nullable=False)
    phone = Column(String(50), default="")
    hours = Column(String(200), default="")
    is_open = Column(Boolean, default=True)
    lat = Column(String(20), default="")
    lng = Column(String(20), default="")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(50), default="")
    hashed_password = Column(String(300), nullable=False)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False, nullable=False)

    token_version = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    oauth_provider = Column(String(30), default="")
    oauth_subject = Column(String(120), default="")

    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    reviews = relationship("Review", back_populates="user")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    quantity = Column(Integer, default=1)
    note = Column(Text, default="")
    price = Column(Float, default=0)
    options = Column(Text, default="")

    user = relationship("User", back_populates="cart_items")
    service = relationship("Service")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String(200), nullable=False)
    customer_email = Column(String(200), nullable=False)
    customer_phone = Column(String(50), default="")
    status = Column(String(50), default="new")
    total = Column(Float, default=0)
    comment = Column(Text, default="")

    delivery_type = Column(String(20), default="pickup")
    delivery_address = Column(String(500), default="")
    office_id = Column(Integer, ForeignKey("offices.id"), nullable=True)

    payment_status = Column(String(20), default="pending")
    payment_method = Column(String(20), default="sbp")
    payment_token = Column(String(64), default="")
    payment_provider = Column(String(30), default="")
    provider_payment_id = Column(String(80), default="")
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    files = relationship("UploadedFile", back_populates="order")
    office = relationship("Office")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    quantity = Column(Integer, default=1)
    price = Column(Float, default=0)
    options = Column(Text, default="")

    order = relationship("Order", back_populates="items")
    service = relationship("Service")

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    original_name = Column(String(300), nullable=False)
    stored_name = Column(String(300), nullable=False)
    content_type = Column(String(100), default="")
    size = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
    order = relationship("Order", back_populates="files")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    author_name = Column(String(200), nullable=False)
    rating = Column(Integer, default=5)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="reviews")

class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    purpose = Column(String(30), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(80), unique=True, nullable=False, index=True)
    scope = Column(String(40), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    response_json = Column(Text, nullable=False)
    status_code = Column(Integer, default=200)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class AdminAudit(Base):
    __tablename__ = "admin_audit"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    admin_email = Column(String(200), nullable=False)
    action = Column(String(80), nullable=False)
    target = Column(String(200), default="")
    diff = Column(Text, default="")
    ip = Column(String(45), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    service = relationship("Service")

class SavedAddress(Base):
    __tablename__ = "saved_addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    label = Column(String(50), default="")
    address = Column(String(500), nullable=False)
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    endpoint = Column(String(500), unique=True, nullable=False)
    p256dh = Column(String(200), nullable=False)
    auth = Column(String(100), nullable=False)
    user_agent = Column(String(300), default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_sent_at = Column(DateTime, nullable=True)

class Refund(Base):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    reason = Column(Text, default="")
    provider = Column(String(30), default="")
    provider_refund_id = Column(String(80), default="")
    status = Column(String(20), default="pending")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
