from __future__ import annotations
import os
import sys
import pytest

os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-at-least-32-chars-long-xxxx")
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("ENABLE_DEV_PAYMENT", "1")
os.environ.setdefault("SCHEDULER_ENABLED", "0")

@pytest.fixture
def client(tmp_path, monkeypatch):

    db_file = tmp_path / "test.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_file}")

    import importlib
    for m in ("main", "auth", "models", "database"):
        sys.modules.pop(m, None)
    import database
    import models
    import main
    importlib.reload(main)

    from fastapi.testclient import TestClient

    with TestClient(main.app) as c:
        yield c
