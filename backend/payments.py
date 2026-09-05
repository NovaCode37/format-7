from __future__ import annotations

import hashlib
import hmac
import os
from typing import Any

import httpx
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential


class PaymentError(Exception):
    pass

def _tbank_verify() -> str | bool:

    bundle = os.environ.get("TBANK_CA_BUNDLE", "").strip()
    if bundle and os.path.exists(bundle):
        return bundle
    return True

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
        resp = httpx.post(f"{self.BASE_URL}{path}", json=payload, timeout=10.0, verify=_tbank_verify())
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
