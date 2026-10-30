import pytest
from fastapi.testclient import TestClient

from app.hearing import SCENE_IDS, Claim, Evidence, Hearing, HearingError, validate
from app.main import app

client = TestClient(app)
BASE = {"category": "robot_vacuum", "scene_id": "rv_clutter", "reason": "청소 시간 줄이기"}


def post(**over):
    return client.post("/api/hearing", json={**BASE, **over})


def test_mock_hearing_links_claims_to_evidence():
    body = post().json()
    assert body["mode"] == "mock"
    ids = {e["id"] for e in body["evidence"]}
    assert all(set(c["evidence_ids"]) <= ids for c in body["claims"])
    assert body["claims"][1]["replies_to"] == "c_pro_1"
    assert not any(e["kind"] == "product_fact" for e in body["evidence"])  # 확인된 사양 없음
    assert body["question"]["options"] and body["answered"] is None


def test_answer_ok_revises_con_with_reason_and_keeps_unverified():
    body = post(answer="ok").json()
    con = body["claims"][1]
    assert con["status"] == "revised" and con["change_reason"]
    # 감수 의사가 제품 사실을 바꾸지 않음: 수정된 주장도 미확인 근거를 계속 인용
    assert "e_obstacle" in con["evidence_ids"]


def test_answer_no_adds_followup_and_skip_changes_nothing():
    assert post(answer="no").json()["claims"][-1]["replies_to"] == "c_con_1"
    skipped = post(answer="skip").json()
    assert skipped["answered"] == "skip"
    assert all(c["status"] == "kept" for c in skipped["claims"])


def test_rejects_scene_of_other_category_and_unknown_answer():
    assert post(scene_id="dw_load").status_code == 422
    assert post(answer="maybe").status_code == 422


@pytest.mark.parametrize("cat, scene", [(c.value, s) for c, ids in SCENE_IDS.items() for s in ids])
def test_every_scene_has_question_and_answers_update_claims(cat, scene):
    base = post(category=cat, scene_id=scene).json()
    assert base["question"] and [o["id"] for o in base["question"]["options"]] == ["ok", "no"]
    assert {e["kind"] for e in base["evidence"]} >= {"assumption", "unverified"}  # 조건은 가정, 성능은 확인 필요
    ok = post(category=cat, scene_id=scene, answer="ok").json()
    assert any(c["status"] == "revised" and c["change_reason"] for c in ok["claims"])
    no = post(category=cat, scene_id=scene, answer="no").json()
    assert no["claims"] != base["claims"] and any(e["kind"] == "unverified" for e in no["evidence"])
    sides = {c["id"]: c["side"] for c in base["claims"]}
    assert all(sides.get(c["id"], c["side"]) == c["side"] for c in ok["claims"] + no["claims"])  # 편이 바뀌지 않음


def _h(claims, evidence=None):
    evidence = evidence or [Evidence(id="e1", kind="user_statement", text="x")]
    return Hearing(scene_id="s", mode="mock", evidence=evidence, claims=claims, question=None, answered=None)


@pytest.mark.parametrize("claims, evidence", [
    ([Claim(id="c1", side="pro", text="t", evidence_ids=["nope"])], None),                       # 없는 근거
    ([Claim(id="c1", side="pro", text="t", evidence_ids=["e1"], replies_to="c9")], None),       # 없는 발언에 반문
    ([Claim(id="c1", side="pro", text="t", evidence_ids=["e1"], status="withdrawn")], None),    # 철회 이유 없음
    ([Claim(id="c1", side="pro", text="t", evidence_ids=["e1"])],
     [Evidence(id="e1", kind="product_fact", text="x", source_id="src_9")]),                     # 출처 없는 제품 사실
])
def test_validate_rejects_bad_output(claims, evidence):
    with pytest.raises(HearingError):
        validate(_h(claims, evidence), {"src_1"})
