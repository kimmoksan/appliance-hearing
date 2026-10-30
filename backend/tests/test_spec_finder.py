import pytest
from fastapi.testclient import TestClient

from app import main
from app.gemini import GeminiError
from app.hearing import Fact, HearingRequest, _prompt
from app.intake import IntakeRequest, build_product

client = TestClient(main.app)
REQ = IntakeRequest(category="dryer", product_text="삼성 DV99XX 건조기", reason="빨래 널기 귀찮아")
WEB = [{"uri": "https://example.com/dv99", "title": "삼성 DV99"}]


def fake(data):
    def generate(prompt, search=False):
        assert search  # 사양 찾기는 검색 그라운딩을 켠다
        return {**data, "_sources": list(data.get("_sources", WEB))}
    return generate


def test_found_specs_are_filled_but_stay_needs_check():
    p = build_product(REQ, generate=fake({"name": "삼성 건조기 (DV99XX)", "specs": {"capacity": "21kg", "size": None, "bogus": "x"}}))
    cap = next(s for s in p.specs if s.key == "capacity")
    assert cap.value == "21kg" and cap.status == "needs_check" and cap.source_id == "src_ai"
    assert all(s.value is None for s in p.specs if s.key != "capacity")  # 없는 항목·모르는 키는 버림
    ai = next(s for s in p.sources if s.kind == "ai")
    assert ai.url == WEB[0]["uri"] and "참고한 웹페이지" in ai.text
    assert p.name == "삼성 건조기 (DV99XX)"


def test_no_web_sources_means_rejected():
    p = build_product(REQ, generate=fake({"name": None, "specs": {"capacity": "21kg"}, "_sources": []}))
    assert not any(s.kind == "ai" for s in p.sources)
    assert all(s.value is None for s in p.specs)
    assert any("근거 웹페이지" in n for n in p.notices)


def test_ai_failure_keeps_input_and_explains():
    def broken(prompt, search=False):
        raise GeminiError("AI 서버 응답 429")
    p = build_product(REQ, generate=broken)
    assert p.sources[0].kind == "user_input" and any("429" in n for n in p.notices)


def test_intake_does_not_call_ai_search_while_disabled(monkeypatch):
    monkeypatch.setenv("APP_MODE", "live")
    monkeypatch.setenv("GEMINI_API_KEY", "test-secret-value")
    monkeypatch.setenv("GEMINI_MODEL", "test-model")
    monkeypatch.setattr(main, "generate_json", lambda *a, **k: pytest.fail("AI 사양 검색은 꺼져 있어야 함"))
    body = client.post("/api/intake", json={"category": "dryer", "product_text": "아무 건조기", "reason": "x"}).json()
    assert any("붙여넣으면" in n for n in body["notices"])


def test_ai_found_source_cannot_be_product_fact():
    req = HearingRequest(category="dryer", scene_id="dr_cycle", reason="x", source_ids=[],
                         facts=[Fact(source_id="src_ai", text="건조 용량: 21kg", verified=False)])
    prompt = _prompt(req)
    assert "<미확인자료>" in prompt and 'id="src_ai"' not in prompt
