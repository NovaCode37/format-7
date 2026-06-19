from __future__ import annotations
import os
import ssl
import json
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from typing import Iterable

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

log = logging.getLogger("notifications")

_RETRY = dict(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=8),
    retry=retry_if_exception_type((httpx.HTTPError, smtplib.SMTPException, OSError)),
    reraise=False,
)

_TG_BASE = "https://api.telegram.org"

def _tg_cfg() -> tuple[str, list[str]]:
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    raw_chats = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    chats = [c.strip() for c in raw_chats.split(",") if c.strip()]
    return token, chats

@retry(**_RETRY)
def _tg_post(token: str, chat_id: str, text: str, parse_mode: str) -> None:
    with httpx.Client(timeout=5.0) as client:
        resp = client.post(
            f"{_TG_BASE}/bot{token}/sendMessage",
            json={
                "chat_id": chat_id,
                "text": text[:4000],
                "parse_mode": parse_mode,
                "disable_web_page_preview": True,
            },
        )
        if resp.status_code >= 500:
            raise httpx.HTTPError(f"telegram 5xx: {resp.status_code}")
        if resp.status_code >= 400:
            log.warning("telegram %s: %s", resp.status_code, resp.text[:200])

def send_telegram(text: str, *, parse_mode: str = "HTML") -> None:

    token, chats = _tg_cfg()
    if not token or not chats:
        return
    for chat_id in chats:
        try:
            _tg_post(token, chat_id, text, parse_mode)
        except Exception as e:
            log.warning("telegram permanent failure for %s: %s", chat_id, e)

def _smtp_cfg() -> dict | None:
    host = os.environ.get("SMTP_HOST", "").strip()
    if not host:
        return None
    return {
        "host": host,
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER", "").strip(),
        "password": os.environ.get("SMTP_PASSWORD", "").strip(),
        "from": os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER", "")),
        "from_name": os.environ.get("SMTP_FROM_NAME", "Format7"),
        "use_tls": os.environ.get("SMTP_TLS", "1") == "1",
        "use_ssl": os.environ.get("SMTP_SSL", "0") == "1",
    }

@retry(**_RETRY)
def _smtp_deliver(cfg: dict, msg, recipients: list[str]) -> None:
    if cfg["use_ssl"]:
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL(cfg["host"], cfg["port"], context=ctx, timeout=10) as srv:
            if cfg["user"]:
                srv.login(cfg["user"], cfg["password"])
            srv.send_message(msg, from_addr=cfg["from"], to_addrs=recipients)
    else:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=10) as srv:
            srv.ehlo()
            if cfg["use_tls"]:
                srv.starttls(context=ssl.create_default_context())
                srv.ehlo()
            if cfg["user"]:
                srv.login(cfg["user"], cfg["password"])
            srv.send_message(msg, from_addr=cfg["from"], to_addrs=recipients)

def send_email(
    to: str | Iterable[str],
    subject: str,
    body: str,
    *,
    html: str | None = None,
    attachments: list[tuple[str, bytes, str]] | None = None,
) -> None:

    cfg = _smtp_cfg()
    if not cfg:
        return
    recipients = [to] if isinstance(to, str) else list(to)
    if not recipients:
        return

    def _body_part():
        if html:
            alt = MIMEMultipart("alternative")
            alt.attach(MIMEText(body, "plain", "utf-8"))
            alt.attach(MIMEText(html, "html", "utf-8"))
            return alt
        return MIMEText(body, "plain", "utf-8")

    if attachments:
        from email.mime.base import MIMEBase
        from email import encoders
        msg = MIMEMultipart("mixed")
        msg.attach(_body_part())
        for fname, data, ctype in attachments:
            maintype, _, subtype = (ctype or "application/octet-stream").partition("/")
            part = MIMEBase(maintype or "application", subtype or "octet-stream")
            part.set_payload(data)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", "attachment", filename=fname)
            msg.attach(part)
    else:
        msg = _body_part()
    msg["Subject"] = subject
    msg["From"] = formataddr((cfg["from_name"], cfg["from"]))
    msg["To"] = ", ".join(recipients)

    try:
        _smtp_deliver(cfg, msg, recipients)
    except Exception as e:
        log.warning("smtp permanent failure: %s", e)

def _html_wrap(title: str, body_html: str, *, cta: dict | None = None) -> str:

    site = os.environ.get("PUBLIC_SITE_URL", "").rstrip("/")
    button = ""
    if cta:
        button = (
            f'<p style="margin:24px 0"><a href="{cta["url"]}" '
            'style="display:inline-block;background:#111;color:#fff;text-decoration:none;'
            "padding:12px 22px;border-radius:6px;font-family:Arial,sans-serif;"
            f'font-size:14px">{cta["label"]}</a></p>'
        )
    return f"""<!doctype html>
<html><body style="margin:0;padding:24px;background:#f7f7f7;
  font-family:Arial,Helvetica,sans-serif;color:#111;line-height:1.55">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eee;
    border-radius:8px;padding:32px">
    <h1 style="font-size:22px;margin:0 0 16px;font-weight:600">{title}</h1>
    <div style="font-size:14px">{body_html}</div>
    {button}
    <hr style="border:0;border-top:1px solid #eee;margin:28px 0">
    <p style="font-size:12px;color:#888;margin:0">
      Format7 — типография в Тюмени.<br>
      <a href="{site}" style="color:#888">{site or "формат7.рф"}</a>
    </p>
  </div>
</body></html>"""

_DELIVERY_RU = {
    "pickup": "Самовывоз",
    "delivery": "Доставка по Тюмени",
    "cdek": "СДЭК",
    "courier": "Курьер",
}

def _delivery_ru(value: str) -> str:
    return _DELIVERY_RU.get((value or "").strip().lower(), value or "—")

def _fmt_order_lines(order) -> str:
    lines = []
    for it in order.items or []:
        try:
            opts = json.loads(it.options) if getattr(it, "options", "") else {}
        except Exception:
            opts = {}
        if not isinstance(opts, dict):
            opts = {}
        svc_name = getattr(it.service, "name", f"#{it.service_id}") if getattr(it, "service", None) else f"#{it.service_id}"
        name = opts.get("Товар") or svc_name
        lines.append(f"  • {name} × {it.quantity} — {it.price:.2f} ₽")
        for k, v in opts.items():
            if not k or k.startswith("_") or k == "Товар":
                continue
            lines.append(f"      {k}: {v}")
    return "\n".join(lines) or "  (без позиций)"

def notify_new_order(order_id) -> None:
    from database import SessionLocal
    from sqlalchemy.orm import joinedload
    from models import Order as _Order, OrderItem as _OrderItem

    if not isinstance(order_id, int):
        order_id = getattr(order_id, "id", None)
    if order_id is None:
        return
    _db = SessionLocal()
    try:
        order = (
            _db.query(_Order)
            .options(joinedload(_Order.items).joinedload(_OrderItem.service))
            .filter(_Order.id == order_id)
            .first()
        )
        if order is None:
            return
        _notify_new_order_impl(order)
    finally:
        _db.close()


def _notify_new_order_impl(order) -> None:

    tg = (
        f"<b>🧾 Новый заказ {order.order_number}</b>\n"
        f"Клиент: {order.customer_name}\n"
        f"Email: {order.customer_email}\n"
        f"Телефон: {order.customer_phone or '—'}\n"
        f"Доставка: {_delivery_ru(order.delivery_type)}"
        + (f" — {order.delivery_address}" if order.delivery_address else "")
        + f"\nСумма: <b>{order.total:.2f} ₽</b>\n\n"
        f"<i>Состав:</i>\n{_fmt_order_lines(order)}"
    )
    if order.comment:
        tg += f"\n\nКомментарий: {order.comment}"
    send_telegram(tg)

    site = os.environ.get("PUBLIC_SITE_URL", "").rstrip("/")
    plain = (
        f"Здравствуйте, {order.customer_name}!\n\n"
        f"Мы получили ваш заказ № {order.order_number}.\n"
        f"Сумма к оплате: {order.total:.2f} ₽.\n\n"
        f"Состав заказа:\n{_fmt_order_lines(order)}\n\n"
        "Статус заказа доступен в личном кабинете."
    )
    html_rows = "".join(
        f"<tr><td style='padding:4px 0'>{getattr(i.service, 'name', f'#{i.service_id}')} × {i.quantity}</td>"
        f"<td style='padding:4px 0;text-align:right'>{i.price:.2f} ₽</td></tr>"
        for i in (order.items or [])
    )
    html = _html_wrap(
        f"Заказ №&nbsp;{order.order_number} принят",
        f"<p>Здравствуйте, {order.customer_name}!</p>"
        f"<p>Мы получили ваш заказ на сумму <b>{order.total:.2f} ₽</b>.</p>"
        f"<table style='width:100%;border-collapse:collapse;margin:16px 0'>"
        f"<tbody style='font-size:13px;color:#444'>{html_rows}</tbody></table>",
        cta={"label": "Перейти к заказу", "url": f"{site}/profile"} if site else None,
    )
    send_email(order.customer_email, f"Заказ {order.order_number} принят", plain, html=html)

    attachments, files_note = _order_attachments(order)

    admin_to = (os.environ.get("ORDER_NOTIFY_EMAIL") or os.environ.get("SMTP_FROM") or "").strip()
    if admin_to:
        admin_plain = (
            f"Новый заказ № {order.order_number}\n\n"
            f"Клиент: {order.customer_name}\n"
            f"Email: {order.customer_email}\n"
            f"Телефон: {order.customer_phone or '—'}\n"
            f"Доставка: {_delivery_ru(order.delivery_type)}"
            + (f" — {order.delivery_address}" if order.delivery_address else "")
            + f"\nСумма: {order.total:.2f} ₽\n\n"
            f"Состав заказа:\n{_fmt_order_lines(order)}\n"
            + (f"\nКомментарий клиента: {order.comment}\n" if order.comment else "")
            + files_note
            + "\nЗаказ также виден в админке: /admin"
        )
        send_email(
            admin_to,
            f"🧾 Новый заказ {order.order_number} — {order.total:.0f} ₽",
            admin_plain,
            attachments=attachments or None,
        )

def _order_attachments(order) -> tuple[list[tuple[str, bytes, str]], str]:

    files = list(getattr(order, "files", None) or [])
    if not files:
        return [], ""
    names = [f.original_name for f in files]
    note = "\nПрикреплённые файлы клиента:\n" + "\n".join(f"  • {n}" for n in names) + "\n"

    max_total = int(os.environ.get("EMAIL_ATTACH_MAX_BYTES", str(18 * 1024 * 1024)))
    attachments: list[tuple[str, bytes, str]] = []
    total = 0
    try:
        import storage
        for f in files:
            stream = storage.open_stream(f.stored_name)
            if stream is None:
                continue
            try:
                data = stream.read()
            finally:
                close = getattr(stream, "close", None)
                if close:
                    close()
            if not data:
                continue
            if total + len(data) > max_total:
                note += "  (часть файлов не вложена — слишком большой размер; скачайте в админке)\n"
                break
            total += len(data)
            attachments.append((f.original_name, data, f.content_type or "application/octet-stream"))
    except Exception as e:
        log.warning("order attachments failed: %s", e)
    return attachments, note

def _push_to_order_user(order, title: str, body: str) -> None:

    if not order.user_id:
        return
    try:
        from database import SessionLocal
        import push as webpush

        db = SessionLocal()
        try:
            webpush.broadcast_to_user(
                db,
                order.user_id,
                {
                    "title": title,
                    "body": body,
                    "url": f"/profile",
                    "tag": f"order-{order.order_number}",
                },
            )
        finally:
            db.close()
    except Exception as e:
        log.warning("push failed: %s", e)

def notify_order_paid(order) -> None:
    send_telegram(
        f"💰 <b>Оплачен {order.order_number}</b> — {order.total:.2f} ₽\n"
        f"Клиент: {order.customer_name} ({order.customer_email})"
    )
    _push_to_order_user(
        order,
        "Оплата получена ✓",
        f"Заказ {order.order_number} оплачен. Принимаемся за работу.",
    )
    plain = (
        f"Здравствуйте, {order.customer_name}!\n\n"
        f"Мы получили оплату по заказу № {order.order_number} на сумму {order.total:.2f} ₽.\n"
        "Принимаемся за работу — уведомим, как только будет готов."
    )
    html = _html_wrap(
        "Оплата получена ✓",
        f"<p>Мы получили оплату по заказу <b>№&nbsp;{order.order_number}</b> "
        f"на сумму <b>{order.total:.2f} ₽</b>.</p>"
        f"<p>Принимаемся за работу — уведомим, как только будет готов.</p>",
    )
    send_email(order.customer_email, f"Заказ {order.order_number} оплачен", plain, html=html)

def notify_password_reset(user, reset_url: str) -> None:
    plain = (
        f"Здравствуйте, {user.name}!\n\n"
        f"Вы запросили сброс пароля на сайте Format7. Ссылка действует 30 минут:\n\n"
        f"{reset_url}\n\n"
        "Если вы не запрашивали сброс — просто проигнорируйте это письмо."
    )
    html = _html_wrap(
        "Сброс пароля",
        f"<p>Здравствуйте, {user.name}.</p>"
        "<p>Вы запросили сброс пароля. Ссылка действует <b>30 минут</b>. "
        "Если запрос был не от вас — просто проигнорируйте это письмо.</p>",
        cta={"label": "Сбросить пароль", "url": reset_url},
    )
    send_email(user.email, "Сброс пароля — Format7", plain, html=html)

def notify_email_verification(user, verify_url: str) -> None:
    plain = (
        f"Здравствуйте, {user.name}!\n\n"
        f"Подтвердите свой email, перейдя по ссылке (действует 24 часа):\n\n{verify_url}\n"
    )
    html = _html_wrap(
        "Подтверждение email",
        f"<p>Здравствуйте, {user.name}.</p>"
        "<p>Нажмите кнопку ниже, чтобы подтвердить email. Ссылка действительна 24 часа.</p>",
        cta={"label": "Подтвердить email", "url": verify_url},
    )
    send_email(user.email, "Подтвердите email — Format7", plain, html=html)

def notify_refund(order, amount: float) -> None:
    send_telegram(
        f"↩️ <b>Возврат {amount:.2f} ₽</b> по заказу {order.order_number}\n"
        f"Клиент: {order.customer_name} ({order.customer_email})"
    )
    plain = (
        f"Здравствуйте, {order.customer_name}!\n\n"
        f"По заказу № {order.order_number} оформлен возврат на сумму {amount:.2f} ₽.\n"
        "Деньги поступят на ту же карту/счёт в течение 10 рабочих дней."
    )
    html = _html_wrap(
        "Возврат оформлен",
        f"<p>По заказу <b>№&nbsp;{order.order_number}</b> оформлен возврат "
        f"на сумму <b>{amount:.2f} ₽</b>.</p>"
        "<p>Зачисление на тот же способ оплаты — до 10 рабочих дней.</p>",
    )
    send_email(order.customer_email, f"Возврат по заказу {order.order_number}", plain, html=html)

def notify_status_changed(order, new_status: str) -> None:
    labels = {
        "new": "Новый",
        "paid": "Оплачен",
        "processing": "В работе",
        "ready": "Готов к выдаче",
        "completed": "Выдан",
        "cancelled": "Отменён",
    }
    messages = {
        "new": "Мы получили ваш заказ и скоро свяжемся с вами.",
        "paid": "Оплата получена — мы приступили к выполнению заказа.",
        "processing": "Мы начали работу над вашим заказом.",
        "ready": "Ваш заказ готов и ждёт вас. Можно забирать!",
        "completed": "Заказ выдан. Спасибо, что выбрали Format7!",
        "cancelled": "К сожалению, заказ был отменён. По вопросам свяжитесь с нами.",
    }
    human = labels.get(new_status, new_status)
    detail = messages.get(new_status, f"Новый статус заказа: {human}.")

    send_telegram(f"📦 <b>{order.order_number}</b>: статус — <i>{human}</i>")
    _push_to_order_user(order, f"Заказ {order.order_number}", detail)

    plain = (
        f"Здравствуйте, {order.customer_name}!\n\n"
        f"Статус вашего заказа № {order.order_number}: {human}.\n"
        f"{detail}\n\n"
        "Отследить заказ можно в личном кабинете на сайте."
    )
    html = _html_wrap(
        f"Заказ №&nbsp;{order.order_number}: {human}",
        f"<p>Здравствуйте, {order.customer_name}!</p>"
        f"<p>Статус вашего заказа <b>№&nbsp;{order.order_number}</b>: <b>{human}</b>.</p>"
        f"<p>{detail}</p>",
    )
    send_email(
        order.customer_email,
        f"Заказ {order.order_number}: {human}",
        plain,
        html=html,
    )
