from fastapi.testclient import TestClient

from app import intake
from app.link_reader import LinkError
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


def test_link_is_read_and_kept_as_link_source(monkeypatch):
    monkeypatch.setattr(intake, "read_link", lambda url: ("로봇청소기 X100", "본문 텍스트"))
    body = post(product_text="https://shop.example/item/1\n추가 메모").json()
    assert body["link_read"] is True and body["name"] == "로봇청소기 X100"
    assert [s["kind"] for s in body["sources"]] == ["link", "user_input"]
    assert body["sources"][0]["url"] == "https://shop.example/item/1"
    assert body["sources"][1]["text"] == "추가 메모"
    assert all(s["value"] is None for s in body["specs"])


def test_link_failure_explains_and_paste_is_optional(monkeypatch):
    def fail(url):
        raise LinkError("사이트가 페이지를 열어 주지 않았어요.")

    monkeypatch.setattr(intake, "read_link", fail)
    res = post(product_text="https://shop.example/item/1")
    body = res.json()
    assert res.status_code == 200
    assert body["link_read"] is False and body["sources"] == []
    assert "사이트가 페이지를 열어 주지 않았어요" in body["notices"][0]
    assert body["name"] == "링크로 입력한 제품"


def test_example_is_labeled_example():
    body = client.get("/api/example").json()
    assert body["is_example"] is True
    assert body["sources"][0]["kind"] == "example"
    assert all(s["value"] is None for s in body["specs"])
