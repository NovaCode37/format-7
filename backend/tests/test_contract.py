import pytest

schemathesis = pytest.importorskip("schemathesis")

@pytest.fixture(scope="module")
def app_for_st():
    import os

    os.environ.setdefault("JWT_SECRET_KEY", "schemathesis-secret-key-32chars-xxxx")
    os.environ.setdefault("APP_ENV", "test")
    os.environ.setdefault("DATABASE_URL", "sqlite:///./st_contract.db")
    os.environ.setdefault("SCHEDULER_ENABLED", "0")

    import importlib
    import database

    importlib.reload(database)
    import models

    importlib.reload(models)
    import main

    importlib.reload(main)
    return main.app

@pytest.fixture(scope="module")
def schema(app_for_st):
    return schemathesis.from_asgi("/openapi.json", app_for_st)

@pytest.fixture
def case(schema):
    return schema

def test_openapi_schema_is_valid(schema):

    assert len(list(schema.get_all_operations())) > 5
