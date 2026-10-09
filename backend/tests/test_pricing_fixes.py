import copy

import pricing_fixes

LIVE = {
    "конверты": {
        "ui": {
            "quantities": {"quantity": [20, 50, 100, 200, 500]},
            "fields": {"paperFinish": {"label": "Бумага", "values": ["Матовая", "Глянцевая"], "hint": "на цену не влияет"}},
        },
    },
    "блокноты": {
        "rounding": 2,
        "ui": {
            "quantities": {"quantity": [10, 20, 30, 50, 100]},
            "fields": {
                "orientation": {"label": "Ориентация", "values": ["По вертикали", "По горизонтали"], "hint": "на цену не влияет"},
                "paperFinish": {"label": "Бумага обложки", "values": ["Матовая", "Глянцевая"], "hint": "на цену не влияет"},
                "blockSides": {"label": "Стороны печати блока", "values": ["Двусторонняя", "Односторонняя"]},
            },
        },
    },
    "визитки": {"rounding": 0, "ui": {"fields": {"rounding": {"label": "Скругление", "values": ["Нет", "4 угла"], "hint": "на цену не влияет"}}}},
    "листовки": {"rounding": 2, "ui": {"quantities": {"quantity": [100, 200, 500, 1000]}}},
}


def _run(configs):
    configs = copy.deepcopy(configs)
    changed, applied = pricing_fixes.apply_pricing_fixes(configs, set())
    return configs, changed, applied


def test_envelopes_get_ten():
    configs, changed, _ = _run(LIVE)
    assert configs["конверты"]["ui"]["quantities"]["quantity"] == [10, 20, 50, 100, 200, 500]
    assert "конверты" in changed


def test_notebooks_get_one_rounding_and_no_hints():
    configs, _, _ = _run(LIVE)
    nb = configs["блокноты"]
    assert nb["ui"]["quantities"]["quantity"][0] == 1
    fields = nb["ui"]["fields"]
    assert "orientation" not in fields
    assert "hint" not in fields["paperFinish"]
    assert fields["rounding"] == {"label": "Скругление углов", "values": ["Нет", "Да"]}
    assert fields["blockSides"]["label"] == "Стороны печати блока"
    assert nb["rounding"] == 2


def test_rounding_costs_two_and_is_yes_no_everywhere():
    configs, changed, _ = _run(LIVE)
    card = configs["визитки"]
    assert card["rounding"] == 2
    assert card["ui"]["fields"]["rounding"]["values"] == ["Нет", "Да"]
    assert "hint" not in card["ui"]["fields"]["rounding"]
    assert "визитки" in changed


def test_untouched_when_nothing_to_change():
    configs, changed, _ = _run({"листовки": LIVE["листовки"]})
    assert configs["листовки"] == LIVE["листовки"]
    assert changed == set()


def test_products_without_saved_config_are_left_to_the_code():
    configs, changed, _ = _run({})
    assert configs == {}
    assert changed == set()


def test_applied_only_once():
    configs = copy.deepcopy(LIVE)
    _, applied = pricing_fixes.apply_pricing_fixes(configs, set())
    configs["конверты"]["ui"]["quantities"]["quantity"] = [20, 50]
    changed, again = pricing_fixes.apply_pricing_fixes(configs, set(applied))
    assert again == []
    assert changed == set()
    assert configs["конверты"]["ui"]["quantities"]["quantity"] == [20, 50]


def test_run_rewrites_rows_once(tmp_path):
    import json

    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    from database import Base
    from models import PricingConfig, SiteSetting

    engine = create_engine(f"sqlite:///{tmp_path / 'p.db'}")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    with Session() as db:
        for slug, cfg in LIVE.items():
            db.add(PricingConfig(slug=slug, data=json.dumps(cfg, ensure_ascii=False)))
        db.commit()

    assert set(pricing_fixes.run(Session)) == {"конверты", "блокноты", "визитки"}
    with Session() as db:
        envelopes = json.loads(db.get(PricingConfig, "конверты").data)
        assert envelopes["ui"]["quantities"]["quantity"][0] == 10
        assert json.loads(db.get(SiteSetting, pricing_fixes.MARKER_KEY).data) == ["2026-10-calculators", "2026-10-hints-and-quarterly-cursor"]
        row = db.get(PricingConfig, "конверты")
        row.data = json.dumps({"ui": {"quantities": {"quantity": [20]}}})
        db.commit()

    assert pricing_fixes.run(Session) == []
    with Session() as db:
        assert json.loads(db.get(PricingConfig, "конверты").data)["ui"]["quantities"]["quantity"] == [20]


def test_no_price_effect_hints_removed_everywhere_but_custom_ones_kept():
    configs = {
        "листовки": {"ui": {"fields": {"orientation": {"label": "Ориентация", "values": ["А", "Б"], "hint": "на цену не влияет"}}}},
        "наклейки": {"ui": {"fields": {"material": {"label": "Материал", "values": ["Бумага"], "hint": "самоклеящаяся"}}}},
    }
    configs, changed, _ = _run(configs)
    assert "hint" not in configs["листовки"]["ui"]["fields"]["orientation"]
    assert configs["наклейки"]["ui"]["fields"]["material"]["hint"] == "самоклеящаяся"
    assert changed == {"листовки"}


def test_quarterly_cursor_gets_prices_and_a_none_option():
    configs = {
        "квартальный-календарь": {
            "lamPoster": 50,
            "ui": {"fields": {"cursor": {"label": "Курсор", "values": ["Пластиковый", "Статический", "Магнитный"], "hint": "входит в стоимость"}}},
        },
    }
    configs, changed, _ = _run(configs)
    q = configs["квартальный-календарь"]
    assert q["cursor"] == {"Нет": 0, "Пластиковый": 10, "Статический": 40, "Магнитный": 70}
    assert q["ui"]["fields"]["cursor"] == {"label": "Курсор", "values": ["Нет", "Пластиковый", "Статический", "Магнитный"]}
    assert q["lamPoster"] == 50
    assert changed == {"квартальный-календарь"}


def test_quarterly_cursor_keeps_prices_the_admin_already_set():
    configs = {"квартальный-календарь": {"cursor": {"Магнитный": 90}}}
    configs, _, _ = _run(configs)
    assert configs["квартальный-календарь"]["cursor"]["Магнитный"] == 90
    assert configs["квартальный-календарь"]["cursor"]["Пластиковый"] == 10
