import io
from urllib.parse import urlparse, parse_qs

def _register(client, email="u@x.com"):
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

def test_hibp_does_not_block_register_when_unreachable(client, monkeypatch):

    import security_checks

    monkeypatch.setattr(
        security_checks,
        "is_password_compromised",
        lambda pwd: False,
    )
    r = client.post(
        "/api/auth/register",
        json={
            "email": "hibp@x.com",
            "name": "U",
            "password": "StrongPwd123!",
            "phone": "",
            "website": "",
            "turnstile_token": "",
        },
    )
    assert r.status_code == 200

def test_push_vapid_public_returns_key_or_empty(client):
    r = client.get("/api/push/vapid-public")
    assert r.status_code == 200

    assert "key" in r.json()

def test_push_subscribe_anonymous_and_replace(client):
    sub = {
        "endpoint": "https://fcm.googleapis.com/fcm/send/abcdef",
        "p256dh": "a" * 60,
        "auth": "b" * 16,
        "user_agent": "pytest/1",
    }
    r1 = client.post("/api/push/subscribe", json=sub)
    assert r1.status_code == 200
    sid1 = r1.json()["id"]

    sub["p256dh"] = "c" * 60
    r2 = client.post("/api/push/subscribe", json=sub)
    assert r2.json()["id"] == sid1

    out = client.post("/api/push/unsubscribe", json={"endpoint": sub["endpoint"]})
    assert out.status_code == 200

def test_oauth_authorize_returns_404_without_credentials(client, monkeypatch):
    monkeypatch.delenv("YANDEX_CLIENT_ID", raising=False)
    monkeypatch.delenv("YANDEX_CLIENT_SECRET", raising=False)
    r = client.get("/api/auth/yandex/authorize", follow_redirects=False)
    assert r.status_code == 404

def test_oauth_callback_exchange_code_flow(client, monkeypatch):
    monkeypatch.setenv("YANDEX_CLIENT_ID", "test-client")
    monkeypatch.setenv("YANDEX_CLIENT_SECRET", "test-secret")

    import main

    monkeypatch.setattr(main.oauth_mod, "exchange_code", lambda provider, code: "oauth-access")
    monkeypatch.setattr(
        main.oauth_mod,
        "fetch_profile",
        lambda provider, access: {
            "subject": "oauth-subject-1",
            "email": "oauth-user@example.com",
            "name": "OAuth User",
        },
    )

    r = client.get(
        "/api/auth/yandex/callback?code=abc&state=state123",
        cookies={"f7_oauth_state": "state123"},
        follow_redirects=False,
    )
    assert r.status_code == 302
    loc = r.headers["location"]
    parsed = urlparse(loc)
    code = (parse_qs(parsed.query).get("code") or [""])[0]
    assert code

    ex = client.post("/api/auth/oauth/exchange", json={"code": code})
    assert ex.status_code == 200, ex.text
    assert ex.json()["access_token"]

    again = client.post("/api/auth/oauth/exchange", json={"code": code})
    assert again.status_code == 400

def test_upload_file_and_get(client):
    token = _register(client)
    h = {"Authorization": f"Bearer {token}"}
    files = {"file": ("test.pdf", io.BytesIO(b"%PDF-1.4\n%fake\n"), "application/pdf")}
    r = client.post("/api/uploads", headers=h, files=files)
    assert r.status_code == 200, r.text
    assert "id" in r.json()
    assert r.json()["original_name"] == "test.pdf"

def test_upload_rejects_disallowed_type(client):
    token = _register(client)
    h = {"Authorization": f"Bearer {token}"}
    files = {"file": ("evil.exe", io.BytesIO(b"MZ\x90\x00"), "application/x-msdownload")}
    r = client.post("/api/uploads", headers=h, files=files)
    assert r.status_code in (400, 415)
