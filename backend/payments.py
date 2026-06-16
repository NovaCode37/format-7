from __future__ import annotations
import ipaddress
import os
import uuid
import hmac
import hashlib
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

YOOKASSA_NETWORKS = [
    ipaddress.ip_network("185.71.76.0/27"),
    ipaddress.ip_network("185.71.77.0/27"),
    ipaddress.ip_network("77.75.153.0/25"),
    ipaddress.ip_network("77.75.154.128/25"),
    ipaddress.ip_network("77.75.156.11/32"),
    ipaddress.ip_network("77.75.156.35/32"),
    ipaddress.ip_network("2a02:5180::/32"),
]

def is_yookassa_ip(ip: str) -> bool:
    try:
        addr = ipaddress.ip_address(ip)
    except ValueError:
        return False
    return any(addr in net for net in YOOKASSA_NETWORKS)

class PaymentError(Exception):
    pass

class YooKassaClient:
    BASE_URL = "https://api.yookassa.ru/v3"

    def __init__(self, shop_id: str, secret_key: str):
        if not shop_id or not secret_key:
            raise PaymentError("YooKassa credentials are not configured")
        self._auth = (shop_id, secret_key)

    _API_RETRY = dict(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=6),
        retry=retry_if_exception_type(httpx.HTTPError),
        reraise=True,
    )

    @staticmethod
    def _build_receipt(customer_email: str, items: list[dict]) -> dict:

        vat_code = int(os.environ.get("YOOKASSA_VAT_CODE", "1"))
        payment_mode = os.environ.get("YOOKASSA_PAYMENT_MODE", "full_prepayment")
        payment_subject = os.environ.get("YOOKASSA_PAYMENT_SUBJECT", "service")
        return {
            "customer": {"email": customer_email},
            "items": [
                {
                    "description": (it["description"] or "Услуга")[:128],
                    "quantity": f"{it.get('quantity', 1)}",
                    "amount": {
                        "value": f"{float(it['amount_rub']):.2f}",
                        "currency": "RUB",
                    },
                    "vat_code": vat_code,
                    "payment_mode": payment_mode,
                    "payment_subject": payment_subject,
                }
                for it in items
            ],
        }

    @retry(**_API_RETRY)
    def _request(self, method: str, path: str, *, json=None, headers=None) -> dict[str, Any]:
        resp = httpx.request(
            method,
            f"{self.BASE_URL}{path}",
            json=json,
            auth=self._auth,
            headers=headers or {},
            timeout=10.0,
        )

        if 500 <= resp.status_code < 600:
            raise httpx.HTTPError(f"YooKassa {resp.status_code}")
        if resp.status_code >= 400:
            raise PaymentError(f"YooKassa {method} {path} failed: {resp.status_code} {resp.text[:300]}")
        return resp.json()

    def create_payment(
        self,
        *,
        amount_rub: float,
        description: str,
        return_url: str,
        metadata: dict[str, Any] | None = None,
        receipt: dict | None = None,
    ) -> dict[str, Any]:

        body: dict[str, Any] = {
            "amount": {"value": f"{amount_rub:.2f}", "currency": "RUB"},
            "capture": True,
            "description": description[:128],
            "confirmation": {"type": "redirect", "return_url": return_url},
            "metadata": metadata or {},
        }
        if receipt:
            body["receipt"] = receipt
        try:
            return self._request(
                "POST",
                "/payments",
                json=body,
                headers={"Idempotence-Key": str(uuid.uuid4())},
            )
        except httpx.HTTPError as e:
            raise PaymentError(f"YooKassa API unreachable: {e}") from e

    def get_payment(self, payment_id: str) -> dict[str, Any]:
        if not payment_id:
            raise PaymentError("Missing payment_id")
        try:
            return self._request("GET", f"/payments/{payment_id}")
        except httpx.HTTPError as e:
            raise PaymentError(f"YooKassa API unreachable: {e}") from e

    def create_refund(
        self,
        *,
        payment_id: str,
        amount_rub: float,
        description: str = "",
    ) -> dict[str, Any]:

        body = {
            "payment_id": payment_id,
            "amount": {"value": f"{amount_rub:.2f}", "currency": "RUB"},
        }
        if description:
            body["description"] = description[:128]
        try:
            return self._request(
                "POST",
                "/refunds",
                json=body,
                headers={"Idempotence-Key": str(uuid.uuid4())},
            )
        except httpx.HTTPError as e:
            raise PaymentError(f"YooKassa API unreachable: {e}") from e

def get_yookassa_client() -> YooKassaClient | None:

    shop_id = os.environ.get("YOOKASSA_SHOP_ID", "").strip()
    secret = os.environ.get("YOOKASSA_SECRET_KEY", "").strip()
    if not shop_id or not secret:
        return None
    return YooKassaClient(shop_id, secret)

class TBankClient:
    BASE_URL = "https://securepay.tinkoff.ru/v2"

    PAID_STATUS = "CONFIRMED"
    PENDING_STATUSES = {"NEW", "FORM_SHOWED", "AUTHORIZING", "AUTHORIZED", "CONFIRMING"}
    FAILED_STATUSES = {"REJECTED", "CANCELED", "DEADLINE_EXPIRED", "AUTH_FAIL", "REVERSED"}

    def __init__(self, terminal_key: str, password: str):
        if not terminal_key or not password:
            raise PaymentError("T-Bank credentials are not configured")
        self._terminal_key = terminal_key
        self._password = password

    _API_RETRY = dict(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=6),
        retry=retry_if_exception_type(httpx.HTTPError),
        reraise=True,
    )

    @property
    def terminal_key(self) -> str:
        return self._terminal_key

    @staticmethod
    def _token_value(value: Any) -> str:
        if isinstance(value, bool):
            return "true" if value else "false"
        return str(value)

    def gen_token(self, params: dict[str, Any]) -> str:

        data = {
            k: v for k, v in params.items()
            if k != "Token" and not isinstance(v, (dict, list))
        }
        data["Password"] = self._password
        concat = "".join(self._token_value(data[k]) for k in sorted(data.keys()))
        return hashlib.sha256(concat.encode("utf-8")).hexdigest()

    def verify_token(self, params: dict[str, Any]) -> bool:
        received = str(params.get("Token", ""))
        if not received:
            return False
        return hmac.compare_digest(received.lower(), self.gen_token(params).lower())

    @retry(**_API_RETRY)
    def _post(self, path: str, payload: dict[str, Any]) -> dict[str, Any]:
        resp = httpx.post(f"{self.BASE_URL}{path}", json=payload, timeout=10.0)
        if 500 <= resp.status_code < 600:
            raise httpx.HTTPError(f"TBank {resp.status_code}")
        if resp.status_code >= 400:
            raise PaymentError(f"TBank {path} failed: {resp.status_code} {resp.text[:300]}")
        return resp.json()

    def init(
        self,
        *,
        amount_rub: float,
        order_id: str,
        description: str,
        notification_url: str,
        success_url: str,
        fail_url: str,
        customer_email: str = "",
        receipt: dict[str, Any] | None = None,
    ) -> dict[str, Any]:

        params: dict[str, Any] = {
            "TerminalKey": self._terminal_key,
            "Amount": int(round(float(amount_rub) * 100)),
            "OrderId": str(order_id),
            "Description": (description or "")[:140],
            "NotificationURL": notification_url,
            "SuccessURL": success_url,
            "FailURL": fail_url,
        }
        if receipt:
            params["Receipt"] = receipt
        params["Token"] = self.gen_token(params)
        try:
            resp = self._post("/Init", params)
        except httpx.HTTPError as e:
            raise PaymentError(f"TBank API unreachable: {e}") from e
        if not resp.get("Success"):
            raise PaymentError(f"TBank Init: {resp.get('Message')} {resp.get('Details')}")
        return resp

    def cancel(
        self,
        payment_id: str,
        *,
        amount_rub: float | None = None,
        receipt: dict[str, Any] | None = None,
    ) -> dict[str, Any]:

        params: dict[str, Any] = {
            "TerminalKey": self._terminal_key,
            "PaymentId": str(payment_id),
        }
        if amount_rub is not None:
            params["Amount"] = int(round(float(amount_rub) * 100))
        if receipt:
            params["Receipt"] = receipt
        params["Token"] = self.gen_token(params)
        try:
            resp = self._post("/Cancel", params)
        except httpx.HTTPError as e:
            raise PaymentError(f"TBank API unreachable: {e}") from e
        if not resp.get("Success"):
            raise PaymentError(f"TBank Cancel: {resp.get('Message')} {resp.get('Details')}")
        return resp

    def get_qr(self, payment_id: str, data_type: str = "PAYLOAD") -> str:

        params: dict[str, Any] = {
            "TerminalKey": self._terminal_key,
            "PaymentId": str(payment_id),
            "DataType": data_type,
        }
        params["Token"] = self.gen_token(params)
        try:
            resp = self._post("/GetQr", params)
        except httpx.HTTPError as e:
            raise PaymentError(f"TBank API unreachable: {e}") from e
        if not resp.get("Success"):
            raise PaymentError(f"TBank GetQr: {resp.get('Message')} {resp.get('Details')}")
        return resp.get("Data", "")

    def get_state(self, payment_id: str) -> dict[str, Any]:

        params: dict[str, Any] = {
            "TerminalKey": self._terminal_key,
            "PaymentId": str(payment_id),
        }
        params["Token"] = self.gen_token(params)
        try:
            resp = self._post("/GetState", params)
        except httpx.HTTPError as e:
            raise PaymentError(f"TBank API unreachable: {e}") from e
        if not resp.get("Success"):
            raise PaymentError(f"TBank GetState: {resp.get('Message')}")
        return resp

def get_tbank_client() -> TBankClient | None:

    key = os.environ.get("TBANK_TERMINAL_KEY", "").strip()
    password = os.environ.get("TBANK_PASSWORD", "").strip()
    if not key or not password:
        return None
    return TBankClient(key, password)

def provider_enabled() -> str:

    return os.environ.get("PAYMENT_PROVIDER", "none").strip().lower()
