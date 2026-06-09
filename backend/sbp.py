from __future__ import annotations
import os
from urllib.parse import quote

def _sanitize(value: str) -> str:

    return value.replace("|", " ").strip()

def get_merchant() -> dict:

    return {
        "name": os.environ.get("SBP_MERCHANT_NAME", "ИП Format7"),
        "personal_acc": os.environ.get("SBP_PERSONAL_ACC", "40802810000000000001"),
        "bank_name": os.environ.get("SBP_BANK_NAME", "АО ТИНЬКОФФ БАНК"),
        "bic": os.environ.get("SBP_BIC", "044525974"),
        "corresp_acc": os.environ.get("SBP_CORRESP_ACC", "30101810145250000974"),
        "inn": os.environ.get("SBP_INN", "7707083893"),
        "kpp": os.environ.get("SBP_KPP", ""),
    }

def build_payload(order_number: str, total_kop: int, purpose: str | None = None) -> str:

    m = get_merchant()
    purpose = purpose or f"Оплата заказа {order_number} на сайте Format7"

    parts = [
        "ST00012",
        f"Name={_sanitize(m['name'])}",
        f"PersonalAcc={_sanitize(m['personal_acc'])}",
        f"BankName={_sanitize(m['bank_name'])}",
        f"BIC={_sanitize(m['bic'])}",
        f"CorrespAcc={_sanitize(m['corresp_acc'])}",
        f"PayeeINN={_sanitize(m['inn'])}",
        f"Sum={total_kop}",
        f"Purpose={_sanitize(purpose)}",
        f"LastName=",
    ]
    if m.get("kpp"):
        parts.append(f"KPP={_sanitize(m['kpp'])}")

    return "|".join(parts)
