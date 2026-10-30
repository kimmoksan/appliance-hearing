from fastapi.testclient import TestClient

from app import rate_limit
from app.main import app

client = TestClient(app)


def test_too_many_requests_get_429_with_korean_message(monkeypatch):
    monkeypatch.setenv("RATE_LIMIT_PER_MIN", "3")
    monkeypatch.setattr(rate_limit, "_hits", rate_limit.defaultdict(rate_limit.deque))
    body = {"category": "robot_vacuum", "scene_id": "rv_daily", "reason": "x"}
    codes = [client.post("/api/hearing", json=body).status_code for _ in range(4)]
    assert codes == [200, 200, 200, 429]
    assert "1분" in client.post("/api/hearing", json=body).json()["detail"]
    # 다른 API는 따로 센다
    assert client.post("/api/intake", json={"category": "dryer", "product_text": "건조기", "reason": "x"}).status_code == 200
