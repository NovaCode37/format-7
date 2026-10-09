import json
from typing import Callable

ROUNDING_PRICE = 2
ROUNDING_FIELD = {"label": "Скругление углов", "values": ["Нет", "Да"]}
ROUNDING_SLUGS = ("визитки", "листовки", "карманные-календари", "блокноты")
MARKER_KEY = "pricing_fixes"


def _add_quantity(cfg: dict, qty: int) -> None:
    quantities = (cfg.get("ui") or {}).get("quantities") or {}
    current = quantities.get("quantity")
    if isinstance(current, list) and qty not in current:
        quantities["quantity"] = sorted({*current, qty})


def _fields(cfg: dict) -> dict:
    return (cfg.get("ui") or {}).get("fields") or {}


def _fix_calculators_2026_10(configs: dict[str, dict]) -> set[str]:
    changed: set[str] = set()

    for slug, qty in (("открытки", 10), ("конверты", 10), ("блокноты", 1)):
        cfg = configs.get(slug)
        if cfg is None:
            continue
        before = json.dumps(cfg, sort_keys=True)
        _add_quantity(cfg, qty)
        if json.dumps(cfg, sort_keys=True) != before:
            changed.add(slug)

    notebook = configs.get("блокноты")
    if notebook is not None:
        before = json.dumps(notebook, sort_keys=True)
        fields = _fields(notebook)
        fields.pop("orientation", None)
        if isinstance(fields.get("paperFinish"), dict):
            fields["paperFinish"].pop("hint", None)
        if fields:
            fields["rounding"] = dict(ROUNDING_FIELD)
        if json.dumps(notebook, sort_keys=True) != before:
            changed.add("блокноты")

    for slug in ROUNDING_SLUGS:
        cfg = configs.get(slug)
        if cfg is None:
            continue
        before = json.dumps(cfg, sort_keys=True)
        cfg["rounding"] = ROUNDING_PRICE
        rounding_field = _fields(cfg).get("rounding")
        if isinstance(rounding_field, dict):
            rounding_field.pop("hint", None)
            rounding_field["values"] = list(ROUNDING_FIELD["values"])
        if json.dumps(cfg, sort_keys=True) != before:
            changed.add(slug)

    return changed


FIXES: list[tuple[str, Callable[[dict[str, dict]], set[str]]]] = [
    ("2026-10-calculators", _fix_calculators_2026_10),
]


def apply_pricing_fixes(configs: dict[str, dict], applied: set[str]) -> tuple[set[str], list[str]]:
    changed: set[str] = set()
    newly_applied: list[str] = []
    for fix_id, fix in FIXES:
        if fix_id in applied:
            continue
        changed |= fix(configs)
        newly_applied.append(fix_id)
    return changed, newly_applied


def run(session_factory) -> list[str]:
    from models import PricingConfig, SiteSetting

    db = session_factory()
    try:
        marker = db.query(SiteSetting).filter(SiteSetting.key == MARKER_KEY).first()
        applied = set(json.loads(marker.data)) if marker and marker.data else set()

        rows = {row.slug: row for row in db.query(PricingConfig).all()}
        configs: dict[str, dict] = {}
        for slug, row in rows.items():
            try:
                configs[slug] = json.loads(row.data) if row.data else {}
            except ValueError:
                continue

        changed, newly_applied = apply_pricing_fixes(configs, applied)
        if not newly_applied:
            return []

        for slug in changed:
            rows[slug].data = json.dumps(configs[slug], ensure_ascii=False)

        if marker is None:
            marker = SiteSetting(key=MARKER_KEY)
            db.add(marker)
        marker.data = json.dumps(sorted(applied | set(newly_applied)))
        db.commit()
        return sorted(changed)
    finally:
        db.close()
