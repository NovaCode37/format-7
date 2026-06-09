def _register(client, email="user@x.com"):
    r = client.post(
        "/api/auth/register",
        json={
            "email": email,
            "name": "U",
            "password": "StrongPwd123!",
            "phone": "",
            "website": "",
            "turnstile_token": "",
        },
    )
    return r.json()["access_token"]

def _seed_service(name="Визитки"):
    from database import SessionLocal
    from models import Service

    db = SessionLocal()
    s = Service(name=name, slug=name.lower(), icon="", description="", order=1)
    db.add(s)
    db.commit()
    db.refresh(s)
    db.close()
    return s.id

def test_wishlist_add_list_remove(client):
    token = _register(client)
    sid = _seed_service()
    h = {"Authorization": f"Bearer {token}"}

    add = client.post("/api/wishlist", headers=h, json={"service_id": sid})
    assert add.status_code == 200, add.text
    item_id = add.json()["id"]

    lst = client.get("/api/wishlist", headers=h)
    assert lst.status_code == 200
    assert len(lst.json()) == 1
    assert lst.json()[0]["service_id"] == sid

    add2 = client.post("/api/wishlist", headers=h, json={"service_id": sid})
    assert add2.json()["id"] == item_id

    rm = client.delete(f"/api/wishlist/{item_id}", headers=h)
    assert rm.status_code == 200
    assert client.get("/api/wishlist", headers=h).json() == []

def test_wishlist_isolated_between_users(client):
    t1 = _register(client, "a@x.com")
    t2 = _register(client, "b@x.com")
    sid = _seed_service()
    h1 = {"Authorization": f"Bearer {t1}"}
    h2 = {"Authorization": f"Bearer {t2}"}

    client.post("/api/wishlist", headers=h1, json={"service_id": sid})
    assert len(client.get("/api/wishlist", headers=h1).json()) == 1
    assert len(client.get("/api/wishlist", headers=h2).json()) == 0

def test_addresses_default_uniqueness(client):
    token = _register(client)
    h = {"Authorization": f"Bearer {token}"}

    a = client.post(
        "/api/addresses", headers=h, json={"label": "Дом", "address": "ул. Ленина 1", "is_default": True}
    ).json()
    b = client.post(
        "/api/addresses", headers=h, json={"label": "Офис", "address": "ул. Республики 50", "is_default": True}
    ).json()

    lst = client.get("/api/addresses", headers=h).json()
    by_id = {x["id"]: x for x in lst}
    assert by_id[a["id"]]["is_default"] is False
    assert by_id[b["id"]]["is_default"] is True

def test_addresses_set_default_endpoint(client):
    token = _register(client)
    h = {"Authorization": f"Bearer {token}"}
    a = client.post("/api/addresses", headers=h, json={"label": "", "address": "addr 1", "is_default": True}).json()
    b = client.post("/api/addresses", headers=h, json={"label": "", "address": "addr 2", "is_default": False}).json()
    client.post(f"/api/addresses/{b['id']}/default", headers=h)
    lst = client.get("/api/addresses", headers=h).json()
    by_id = {x["id"]: x for x in lst}
    assert by_id[a["id"]]["is_default"] is False
    assert by_id[b["id"]]["is_default"] is True

def test_addresses_remove_unauthorized_other_user(client):
    t1 = _register(client, "a@x.com")
    t2 = _register(client, "b@x.com")
    a = client.post("/api/addresses", headers={"Authorization": f"Bearer {t1}"}, json={"address": "addr 1"}).json()

    r = client.delete(f"/api/addresses/{a['id']}", headers={"Authorization": f"Bearer {t2}"})
    assert r.status_code == 404
