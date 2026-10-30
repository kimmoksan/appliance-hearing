from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_default_is_mock(monkeypatch):
    monkeypatch.delenv("APP_MODE", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert client.get("/api/health").json() == {"status": "ok", "mode": "mock"}


def test_live_without_key_stays_mock(monkeypatch):
    monkeypatch.setenv("APP_MODE", "live")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert client.get("/api/health").json()["mode"] == "mock"


def test_live_with_key_never_leaks_key(monkeypatch):
    monkeypatch.setenv("APP_MODE", "live")
    monkeypatch.setenv("GEMINI_API_KEY", "test-secret-value")
    monkeypatch.setenv("GEMINI_MODEL", "test-model")
    res = client.get("/api/health")
    assert res.json()["mode"] == "live"
    assert "test-secret-value" not in res.text
