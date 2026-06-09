def _reg(client, email="test@example.com", password="Password123!"):
    return client.post(
        "/api/auth/register",
        json={
            "email": email,
            "name": "Test User",
            "password": password,
            "phone": "",
            "website": "",
            "turnstile_token": "",
        },
    )

def test_register_login_me_flow(client):
    r = _reg(client, "alice@example.com", "StrongPwd1234!")
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == "alice@example.com"
    assert me.json()["email_verified"] is False

def test_register_rejects_duplicate_email_with_generic_message(client):
    _reg(client, "dup@example.com", "StrongPwd1234!")
    r = _reg(client, "dup@example.com", "AnotherPwd9876!")
    assert r.status_code == 400

    assert "уже" not in r.text.lower()

def test_register_rejects_honeypot(client):
    r = client.post(
        "/api/auth/register",
        json={
            "email": "bot@example.com",
            "name": "Bot",
            "password": "StrongPwd1234!",
            "phone": "",
            "website": "http://bot.example.com",
            "turnstile_token": "",
        },
    )
    assert r.status_code == 400

def test_login_wrong_password(client):
    _reg(client, "bob@example.com", "StrongPwd1234!")
    r = client.post(
        "/api/auth/login",
        json={"email": "bob@example.com", "password": "WrongOne1234!", "turnstile_token": ""},
    )
    assert r.status_code == 401

def test_password_change_rotates_token(client):
    r = _reg(client, "carol@example.com", "StrongPwd1234!")
    old_token = r.json()["access_token"]

    change = client.post(
        "/api/auth/change-password",
        headers={"Authorization": f"Bearer {old_token}"},
        json={"current_password": "StrongPwd1234!", "new_password": "BrandNew987!"},
    )
    assert change.status_code == 200
    new_token = change.json().get("access_token")
    assert new_token and new_token != old_token

    me_old = client.get("/api/auth/me", headers={"Authorization": f"Bearer {old_token}"})
    assert me_old.status_code == 401

    me_new = client.get("/api/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert me_new.status_code == 200

def test_logout_all_invalidates_token(client):
    r = _reg(client, "dave@example.com", "StrongPwd1234!")
    token = r.json()["access_token"]
    client.post("/api/auth/logout-all", headers={"Authorization": f"Bearer {token}"})
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 401
