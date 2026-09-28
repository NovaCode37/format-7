def _seed_service(client):

    from database import SessionLocal
    from models import Service

    db = SessionLocal()
    svc = Service(name="Визитки", slug="vizitki", icon="💳", description="", order=1)
    db.add(svc)
    db.commit()
    db.refresh(svc)
    db.close()
    return svc.id

def _mk_order_payload(service_id):
    return {
        "customer_name": "Иван Иванов",
        "customer_email": "ivan@example.com",
        "customer_phone": "+79001234567",
        "comment": "",
        "items": [{"service_id": service_id, "quantity": 2, "price": 500}],
        "delivery_type": "pickup",
    }

def test_create_order(client):
    sid = _seed_service(client)
    r = client.post("/api/orders", json=_mk_order_payload(sid))
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["order_number"].startswith("F7-")
    assert len(data["order_number"]) == 3 + 16
    assert data["payment_token"]
    assert data["total"] == 1000.0

def test_create_order_unknown_service_falls_back_to_catalog(client):
    sid = _seed_service(client)
    r = client.post("/api/orders", json=_mk_order_payload(999999))
    assert r.status_code == 200, r.text
    assert r.json()["items"][0]["service_id"] == sid

def test_create_order_rejects_when_catalog_empty(client):
    r = client.post("/api/orders", json=_mk_order_payload(999999))
    assert r.status_code == 503
    assert r.json()["detail"] == "Каталог услуг недоступен"

def test_idempotency_key_returns_same_order(client):
    sid = _seed_service(client)
    key = "client-uuid-abcdef1234567890"
    r1 = client.post(
        "/api/orders",
        json=_mk_order_payload(sid),
        headers={"Idempotency-Key": key},
    )
    r2 = client.post(
        "/api/orders",
        json=_mk_order_payload(sid),
        headers={"Idempotency-Key": key},
    )
    assert r1.status_code == 200 and r2.status_code == 200
    assert r1.json()["order_number"] == r2.json()["order_number"]

def test_different_keys_create_different_orders(client):
    sid = _seed_service(client)
    r1 = client.post("/api/orders", json=_mk_order_payload(sid), headers={"Idempotency-Key": "key-aaaaaaaaaaaaaaaaa"})
    r2 = client.post("/api/orders", json=_mk_order_payload(sid), headers={"Idempotency-Key": "key-bbbbbbbbbbbbbbbbb"})
    assert r1.json()["order_number"] != r2.json()["order_number"]

def test_payment_info_public_by_order_number(client):
    sid = _seed_service(client)
    r = client.post("/api/orders", json=_mk_order_payload(sid))
    num = r.json()["order_number"]
    info = client.get(f"/api/orders/{num}/payment")
    assert info.status_code == 200
    assert info.json()["total"] == 1000.0
    assert "sbp_payload" in info.json()

def test_mark_paid_requires_token(client):
    sid = _seed_service(client)
    r = client.post("/api/orders", json=_mk_order_payload(sid))
    num = r.json()["order_number"]
    pt = r.json()["payment_token"]

    bad = client.post(f"/api/orders/{num}/mark-paid")
    assert bad.status_code == 403

    wrong = client.post(f"/api/orders/{num}/mark-paid", headers={"X-Payment-Token": "wrong"})
    assert wrong.status_code == 403

    ok = client.post(f"/api/orders/{num}/mark-paid", headers={"X-Payment-Token": pt})
    assert ok.status_code == 200
    assert ok.json()["payment_status"] == "paid"

def test_health_endpoint(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_pay_init_tbank_reuses_pending_payment(client, monkeypatch):
    sid = _seed_service(client)
    created = client.post("/api/orders", json=_mk_order_payload(sid)).json()
    num = created["order_number"]
    pt = created["payment_token"]

    class FakeTB:
        PAID_STATUS = "CONFIRMED"
        PENDING_STATUSES = {"NEW"}
        FAILED_STATUSES = {"REJECTED"}

        def __init__(self):
            self.inited = 0

        def init(self, **kwargs):
            self.inited += 1
            return {"Success": True, "PaymentId": "pay_1", "PaymentURL": "https://pay.test/form"}

        def get_state(self, payment_id):
            assert payment_id == "pay_1"
            return {"Success": True, "Status": "NEW"}

        def get_qr(self, payment_id, data_type="PAYLOAD"):
            return "qr-payload"

    tb = FakeTB()

    import main

    monkeypatch.setenv("PAYMENT_PROVIDER", "tbank")
    monkeypatch.setattr(main, "get_tbank_client", lambda: tb)

    r1 = client.post(f"/api/orders/{num}/pay/init", headers={"X-Payment-Token": pt})
    r2 = client.post(f"/api/orders/{num}/pay/init", headers={"X-Payment-Token": pt})
    assert r1.status_code == 200, r1.text
    assert r2.status_code == 200, r2.text
    assert r1.json()["provider_payment_id"] == "pay_1"
    assert r2.json()["provider_payment_id"] == "pay_1"
    assert tb.inited == 1

def test_tbank_webhook_rejects_bad_token(client, monkeypatch):
    class FakeTB:
        PAID_STATUS = "CONFIRMED"
        FAILED_STATUSES = {"REJECTED"}

        def verify_token(self, data):
            return False

    import main

    monkeypatch.setattr(main, "get_tbank_client", lambda: FakeTB())
    r = client.post(
        "/api/payments/webhook/tbank",
        json={"OrderId": "F7-DEADBEEF", "Status": "CONFIRMED", "Token": "bad"},
    )
    assert r.status_code == 403

def test_tbank_webhook_marks_order_paid_when_amount_matches(client, monkeypatch):
    sid = _seed_service(client)
    created = client.post("/api/orders", json=_mk_order_payload(sid)).json()
    num = created["order_number"]

    from database import SessionLocal
    from models import Order

    db = SessionLocal()
    order = db.query(Order).filter(Order.order_number == num).first()
    order.payment_provider = "tbank"
    order.provider_payment_id = "pay_ok_1"
    db.commit()
    db.close()

    class FakeTB:
        PAID_STATUS = "CONFIRMED"
        FAILED_STATUSES = {"REJECTED"}

        def verify_token(self, data):
            return True

    import main

    monkeypatch.setattr(main, "get_tbank_client", lambda: FakeTB())

    r = client.post(
        "/api/payments/webhook/tbank",
        json={"OrderId": num, "Status": "CONFIRMED", "Amount": 100000, "Token": "ok"},
    )
    assert r.status_code == 200, r.text

    db = SessionLocal()
    order = db.query(Order).filter(Order.order_number == num).first()
    assert order.payment_status == "paid"
    assert order.status == "paid"
    db.close()

def test_tbank_webhook_ignores_amount_mismatch(client, monkeypatch):
    sid = _seed_service(client)
    created = client.post("/api/orders", json=_mk_order_payload(sid)).json()
    num = created["order_number"]

    from database import SessionLocal
    from models import Order

    db = SessionLocal()
    order = db.query(Order).filter(Order.order_number == num).first()
    order.payment_provider = "tbank"
    order.provider_payment_id = "pay_bad_1"
    db.commit()
    db.close()

    class FakeTB:
        PAID_STATUS = "CONFIRMED"
        FAILED_STATUSES = {"REJECTED"}

        def verify_token(self, data):
            return True

    import main

    monkeypatch.setattr(main, "get_tbank_client", lambda: FakeTB())

    r = client.post(
        "/api/payments/webhook/tbank",
        json={"OrderId": num, "Status": "CONFIRMED", "Amount": 1, "Token": "ok"},
    )
    assert r.status_code == 200

    db = SessionLocal()
    order = db.query(Order).filter(Order.order_number == num).first()
    assert order.payment_status == "pending"
    db.close()

def test_admin_refund_tbank_success(client, monkeypatch):
    sid = _seed_service(client)
    created = client.post("/api/orders", json=_mk_order_payload(sid)).json()
    num = created["order_number"]

    from database import SessionLocal
    from models import Order

    db = SessionLocal()
    order = db.query(Order).filter(Order.order_number == num).first()
    order.payment_status = "paid"
    order.payment_provider = "tbank"
    order.provider_payment_id = "pay_ref_1"
    db.commit()
    db.close()

    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com")
    reg = client.post(
        "/api/auth/register",
        json={
            "email": "admin@example.com",
            "name": "Admin Adminov",
            "password": "StrongPwd123!",
            "phone": "",
            "website": "",
            "turnstile_token": "",
        },
    )
    token = reg.json()["access_token"]

    class FakeTB:
        PAID_STATUS = "CONFIRMED"
        FAILED_STATUSES = {"REJECTED"}

        def cancel(self, payment_id, *, amount_rub=None, receipt=None):
            return {"Success": True, "Status": "PARTIAL_REFUNDED", "PaymentId": payment_id}

    import main

    monkeypatch.setattr(main, "get_tbank_client", lambda: FakeTB())

    r = client.post(
        f"/api/admin/orders/{num}/refund",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 100.0, "reason": "test"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "succeeded"

def test_refund_cap_counts_pending_refunds(client, monkeypatch):
    sid = _seed_service(client)
    created = client.post("/api/orders", json=_mk_order_payload(sid)).json()
    num = created["order_number"]

    from database import SessionLocal
    from models import Order

    db = SessionLocal()
    order = db.query(Order).filter(Order.order_number == num).first()
    order.payment_status = "paid"
    order.payment_provider = "tbank"
    order.provider_payment_id = "pay_ref_2"
    db.commit()
    db.close()

    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com")
    reg = client.post(
        "/api/auth/register",
        json={
            "email": "admin@example.com",
            "name": "Admin Adminov",
            "password": "StrongPwd123!",
            "phone": "",
            "website": "",
            "turnstile_token": "",
        },
    )
    token = reg.json()["access_token"]

    class FakeTB:
        PAID_STATUS = "CONFIRMED"
        FAILED_STATUSES = {"REJECTED"}

        def cancel(self, payment_id, *, amount_rub=None, receipt=None):
            return {"Success": True, "Status": "PROCESSING", "PaymentId": payment_id}

    import main

    monkeypatch.setattr(main, "get_tbank_client", lambda: FakeTB())
    h = {"Authorization": f"Bearer {token}"}

    first = client.post(f"/api/admin/orders/{num}/refund", headers=h, json={"amount": 700.0, "reason": ""})
    assert first.status_code == 200, first.text
    assert first.json()["status"] == "pending"

    second = client.post(f"/api/admin/orders/{num}/refund", headers=h, json={"amount": 700.0, "reason": ""})
    assert second.status_code == 400

def _seed_priced_service(price_from):

    from database import SessionLocal
    from models import Service

    db = SessionLocal()
    svc = Service(name="Календари", slug="kalendari", icon="📅", description="", order=1, price_from=price_from)
    db.add(svc)
    db.commit()
    db.refresh(svc)
    db.close()
    return svc.id

def _one_item_payload(service_id, price, quantity=1):
    payload = _mk_order_payload(service_id)
    payload["items"] = [{"service_id": service_id, "quantity": quantity, "price": price}]
    return payload

def test_price_floor_rejects_underpriced_known_service(client):
    sid = _seed_priced_service(1000)
    r = client.post("/api/orders", json=_one_item_payload(sid, 1))
    assert r.status_code == 400
    assert r.json()["detail"] == "Некорректная стоимость позиции"

def test_price_floor_applies_to_unknown_service_fallback(client):
    _seed_priced_service(1000)
    r = client.post("/api/orders", json=_one_item_payload(999999, 1))
    assert r.status_code == 400
    assert r.json()["detail"] == "Некорректная стоимость позиции"

def test_price_floor_allows_fair_price_on_fallback(client):
    sid = _seed_priced_service(1000)
    r = client.post("/api/orders", json=_one_item_payload(999999, 1000))
    assert r.status_code == 200, r.text
    assert r.json()["items"][0]["service_id"] == sid
