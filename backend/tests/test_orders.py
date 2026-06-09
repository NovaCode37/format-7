def _seed_service(client):

    import importlib
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

def test_create_order_rejects_unknown_service(client):
    payload = _mk_order_payload(999999)
    r = client.post("/api/orders", json=payload)
    assert r.status_code == 400
    assert r.json()["detail"] == "Услуга не найдена"

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

def test_pay_init_yookassa_is_idempotent(client, monkeypatch):
    sid = _seed_service(client)
    created = client.post("/api/orders", json=_mk_order_payload(sid)).json()
    num = created["order_number"]
    pt = created["payment_token"]

    class FakeYK:
        def __init__(self):
            self.created = 0

        def create_payment(self, **kwargs):
            self.created += 1
            return {
                "id": "pay_1",
                "confirmation": {"confirmation_url": "https://pay.test/confirm"},
            }

        def get_payment(self, payment_id):
            assert payment_id == "pay_1"
            return {
                "id": payment_id,
                "status": "pending",
                "confirmation": {"confirmation_url": "https://pay.test/confirm"},
            }

    yk = FakeYK()

    import main

    monkeypatch.setenv("PAYMENT_PROVIDER", "yookassa")
    monkeypatch.setattr(main, "get_yookassa_client", lambda: yk)

    r1 = client.post(f"/api/orders/{num}/pay/init", headers={"X-Payment-Token": pt})
    r2 = client.post(f"/api/orders/{num}/pay/init", headers={"X-Payment-Token": pt})
    assert r1.status_code == 200, r1.text
    assert r2.status_code == 200, r2.text
    assert r1.json()["provider_payment_id"] == "pay_1"
    assert r2.json()["provider_payment_id"] == "pay_1"
    assert yk.created == 1

def test_yookassa_webhook_ignores_spoofed_forwarded_for(client, monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("TRUSTED_PROXY_CIDRS", "10.0.0.0/8")

    import main

    monkeypatch.setattr(main, "get_yookassa_client", lambda: object())
    r = client.post(
        "/api/payments/webhook/yookassa",
        json={"object": {"id": "pay_spoofed"}},
        headers={"X-Forwarded-For": "185.71.76.1"},
    )
    assert r.status_code == 403

def test_yookassa_webhook_marks_order_paid_when_amount_matches(client, monkeypatch):
    sid = _seed_service(client)
    created = client.post("/api/orders", json=_mk_order_payload(sid)).json()
    num = created["order_number"]

    from database import SessionLocal
    from models import Order

    db = SessionLocal()
    order = db.query(Order).filter(Order.order_number == num).first()
    order.payment_provider = "yookassa"
    order.provider_payment_id = "pay_ok_1"
    db.commit()
    db.close()

    class FakeYK:
        def get_payment(self, payment_id):
            return {"id": payment_id, "status": "succeeded", "amount": {"value": "1000.00"}}

    import main

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("TRUSTED_PROXY_CIDRS", "127.0.0.1/32")
    monkeypatch.setattr(main, "get_yookassa_client", lambda: FakeYK())
    monkeypatch.setattr(main, "_get_forwarded_ip", lambda request: "185.71.76.1")

    r = client.post(
        "/api/payments/webhook/yookassa",
        json={"object": {"id": "pay_ok_1"}},
        headers={"X-Forwarded-For": "185.71.76.1"},
    )
    assert r.status_code == 200, r.text

    db = SessionLocal()
    order = db.query(Order).filter(Order.order_number == num).first()
    assert order.payment_status == "paid"
    assert order.status == "paid"
    db.close()

def test_admin_refund_yookassa_success(client, monkeypatch):
    sid = _seed_service(client)
    created = client.post("/api/orders", json=_mk_order_payload(sid)).json()
    num = created["order_number"]

    from database import SessionLocal
    from models import Order

    db = SessionLocal()
    order = db.query(Order).filter(Order.order_number == num).first()
    order.payment_status = "paid"
    order.payment_provider = "yookassa"
    order.provider_payment_id = "pay_ref_1"
    db.commit()
    db.close()

    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com")
    reg = client.post(
        "/api/auth/register",
        json={
            "email": "admin@example.com",
            "name": "Admin",
            "password": "StrongPwd123!",
            "phone": "",
            "website": "",
            "turnstile_token": "",
        },
    )
    token = reg.json()["access_token"]

    class FakeYK:
        def create_refund(self, **kwargs):
            return {"id": "rf_1", "status": "succeeded"}

    import main

    monkeypatch.setattr(main, "get_yookassa_client", lambda: FakeYK())

    r = client.post(
        f"/api/admin/orders/{num}/refund",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 100.0, "reason": "test"},
    )
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "succeeded"
