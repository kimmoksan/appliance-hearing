from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
OK = {"category": "robot_vacuum", "product_text": "로봇청소기 X100\n흡입력 등 사양", "reason": "청소 시간 줄이기"}


def post(**over):
    return client.post("/api/intake", json={**OK, **over})


def test_valid_input_keeps_text_as_source_and_guesses_no_spec():
    body = post().json()
    assert body["name"] == "로봇청소기 X100"
    assert body["sources"][0]["kind"] == "user_input"
    assert body["sources"][0]["text"] == OK["product_text"]
    assert body["specs"] and all(s["value"] is None and s["status"] == "needs_check" for s in body["specs"])
    assert body["is_example"] is False


def test_rejects_unsupported_category():
    assert post(category="tv").status_code == 422


def test_rejects_blank_and_too_long():
    assert post(reason="   ").status_code == 422
    assert post(product_text="").status_code == 422
    assert post(reason="가" * 201).status_code == 422
    assert post(product_text="가" * 5001).status_code == 422


def test_link_only_is_not_fetched_and_asks_for_paste():
    body = post(product_text="https://shop.example/item/1").json()
    assert body["link_only"] is True
    assert body["notices"]
    assert body["name"] == "링크로 입력한 제품"


def test_example_is_labeled_example():
    body = client.get("/api/example").json()
    assert body["is_example"] is True
    assert body["sources"][0]["kind"] == "example"
    assert all(s["value"] is None for s in body["specs"])
