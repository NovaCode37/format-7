from __future__ import annotations
import os
import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Order, AuthToken, IdempotencyRecord
from payments import get_yookassa_client, PaymentError
from notifications import notify_order_paid

log = logging.getLogger("scheduler")
_scheduler: AsyncIOScheduler | None = None

def _reconcile_payments() -> None:

    client = get_yookassa_client()
    if client is None:
        return
    db: Session = SessionLocal()
    try:
        cutoff_old = datetime.utcnow() - timedelta(minutes=2)
        cutoff_young = datetime.utcnow() - timedelta(days=7)
        stale = (
            db.query(Order)
            .filter(
                Order.payment_provider == "yookassa",
                Order.payment_status == "pending",
                Order.provider_payment_id != "",
                Order.created_at < cutoff_old,
                Order.created_at > cutoff_young,
            )
            .limit(50)
            .all()
        )
        for order in stale:
            try:
                payment = client.get_payment(order.provider_payment_id)
            except PaymentError as e:
                log.warning("reconcile: %s %s", order.order_number, e)
                continue
            status = payment.get("status")
            if status == "succeeded":
                paid = float((payment.get("amount") or {}).get("value", "0") or 0)
                if abs(paid - float(order.total or 0)) > 0.01:
                    log.warning("reconcile: amount mismatch on %s", order.order_number)
                    continue
                order.payment_status = "paid"
                order.paid_at = datetime.utcnow()
                if order.status == "new":
                    order.status = "paid"
                db.commit()
                db.refresh(order)
                notify_order_paid(order)
                log.info("reconcile: recovered payment for %s", order.order_number)
            elif status in ("canceled", "failed"):
                order.payment_status = "failed"
                db.commit()
    except Exception as e:
        log.exception("reconcile failed: %s", e)
    finally:
        db.close()

def _cleanup_expired() -> None:

    db: Session = SessionLocal()
    try:
        now = datetime.utcnow()

        db.query(AuthToken).filter(AuthToken.expires_at < now).delete()

        cutoff = now - timedelta(hours=24)
        db.query(IdempotencyRecord).filter(IdempotencyRecord.created_at < cutoff).delete()
        db.commit()
    except Exception as e:
        log.exception("cleanup failed: %s", e)
    finally:
        db.close()

def start() -> None:

    global _scheduler
    if os.environ.get("SCHEDULER_ENABLED", "1") != "1":
        log.info("scheduler disabled via env")
        return
    if _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler(timezone="UTC")
    _scheduler.add_job(_reconcile_payments, "interval", minutes=10, id="reconcile", max_instances=1, coalesce=True)
    _scheduler.add_job(_cleanup_expired, "interval", hours=1, id="cleanup", max_instances=1, coalesce=True)
    _scheduler.start()
    log.info("scheduler started (reconcile every 10m, cleanup hourly)")

def shutdown() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
