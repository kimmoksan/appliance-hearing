"""청문회(찬반 공방) 데이터 규격, 의미 검증, 예시(mock) 생성.

AI 연동 후에도 모델 출력은 validate()를 통과해야 화면에 나간다.
AI는 승자·점수·구매 판결을 내지 않는다 — 그런 필드 자체가 없다.
"""

from typing import Literal

from pydantic import BaseModel, Field

from app.intake import Category

SCENE_IDS: dict[Category, list[str]] = {
    Category.robot_vacuum: ["rv_daily", "rv_clutter", "rv_maintenance"],
    Category.dishwasher: ["dw_load", "dw_constraint", "dw_maintenance"],
    Category.dryer: ["dr_cycle", "dr_constraint", "dr_maintenance"],
    Category.air_purifier: ["ap_run", "ap_night", "ap_filter"],
}
MAX_CLAIMS = 6
MAX_TEXT = 200

EvidenceKind = Literal["product_fact", "user_statement", "assumption", "unverified"]


class Evidence(BaseModel):
    id: str
    kind: EvidenceKind
    text: str = Field(max_length=MAX_TEXT)
    source_id: str | None = None  # product_fact일 때 제품 출처 ID


class Claim(BaseModel):
    id: str
    side: Literal["pro", "con"]
    text: str = Field(max_length=MAX_TEXT)
    evidence_ids: list[str]
    replies_to: str | None = None
    status: Literal["kept", "revised", "withdrawn"] = "kept"
    change_reason: str | None = None


class Option(BaseModel):
    id: str
    label: str


class Question(BaseModel):
    id: str
    text: str
    options: list[Option]  # 건너뛰기는 화면에서 항상 제공


class Hearing(BaseModel):
    scene_id: str
    mode: Literal["mock", "live"]
    evidence: list[Evidence]
    claims: list[Claim]
    question: Question | None
    answered: str | None  # 선택한 option id, 'skip', 또는 None


class HearingRequest(BaseModel):
    category: Category
    scene_id: str
    reason: str = Field(min_length=1, max_length=200)
    source_ids: list[str] = Field(default_factory=list, max_length=20)
    answer: str | None = Field(default=None, max_length=40)


class HearingError(ValueError):
    pass


def validate(h: Hearing, source_ids: set[str]) -> None:
    """형식이 맞아도 의미가 틀린 출력을 막는다."""
    ev = {e.id: e for e in h.evidence}
    if len(ev) != len(h.evidence):
        raise HearingError("근거 ID가 중복됐어요.")
    for e in h.evidence:
        if e.kind == "product_fact" and e.source_id not in source_ids:
            raise HearingError(f"제품 사실 {e.id}의 출처가 없어요.")
    if not h.claims or len(h.claims) > MAX_CLAIMS:
        raise HearingError("발언 수가 범위를 벗어났어요.")
    seen: set[str] = set()
    for c in h.claims:
        if c.id in seen:
            raise HearingError("발언 ID가 중복됐어요.")
        if not c.evidence_ids or any(i not in ev for i in c.evidence_ids):
            raise HearingError(f"발언 {c.id}가 없는 근거를 인용했어요.")
        if c.replies_to is not None and c.replies_to not in seen:
            raise HearingError(f"발언 {c.id}가 없는 발언에 반문했어요.")
        if c.status != "kept" and not c.change_reason:
            raise HearingError(f"발언 {c.id}의 수정·철회 이유가 없어요.")
        seen.add(c.id)


# --- 예시(mock) 생성: 실제 AI 응답이 아님 ---

def _rv_clutter(reason: str, answer: str | None) -> Hearing:
    evidence = [
        Evidence(id="e_reason", kind="user_statement", text=f"구매 이유: “{reason}”"),
        Evidence(id="e_floor", kind="assumption", text="바닥에 양말·책·케이블 같은 작은 물건이 놓여 있음 (장면의 가정)"),
        Evidence(id="e_obstacle", kind="unverified", text="이 제품이 바닥의 작은 물건을 얼마나 인식하고 피하는지는 확인되지 않았어요."),
    ]
    claims = [
        Claim(id="c_pro_1", side="pro", text="직접 청소하는 부담을 줄인다는 점에서 구매 목적에 맞아요.", evidence_ids=["e_reason"]),
        Claim(id="c_con_1", side="con", text="바닥 정리가 필요하다면, 그 수고도 감수할 수 있나요?",
              evidence_ids=["e_floor", "e_obstacle"], replies_to="c_pro_1"),
    ]
    question = Question(id="q_floor", text="바닥을 미리 정리하는 건 괜찮나요?",
                        options=[Option(id="ok", label="괜찮아요"), Option(id="no", label="그것도 싫어요")])
    if answer == "ok":
        evidence.append(Evidence(id="e_ans", kind="user_statement", text="사용자: 바닥을 미리 정리하는 건 괜찮다"))
        claims[1] = claims[1].model_copy(update={
            "text": "정리 부담은 남지만, 이 사용자에게 결정적인 단점에서는 제외해요.", "evidence_ids": ["e_floor", "e_obstacle", "e_ans"],
            "status": "revised", "change_reason": "사용자가 사전 정리를 감수할 수 있다고 답했어요. 제품의 장애물 대응 정보는 여전히 확인 필요예요.",
        })
    elif answer == "no":
        evidence.append(Evidence(id="e_ans", kind="user_statement", text="사용자: 바닥을 미리 정리하는 것도 부담된다"))
        claims.append(Claim(id="c_con_2", side="con", text="사전 정리가 부담이라면 이 장면의 불편은 중요한 고려 사항으로 남아요.",
                            evidence_ids=["e_ans", "e_obstacle"], replies_to="c_con_1"))
    return Hearing(scene_id="rv_clutter", mode="mock", evidence=evidence, claims=claims, question=question, answered=answer)


def _generic(scene_id: str, reason: str) -> Hearing:
    # shortcut: rv_clutter 외 장면은 공통 틀. AI 연동(feature/ai-scene-planner) 때 장면별 내용으로 대체.
    evidence = [
        Evidence(id="e_reason", kind="user_statement", text=f"구매 이유: “{reason}”"),
        Evidence(id="e_scene", kind="assumption", text="이 장면의 조건이 내 생활에도 해당한다고 가정"),
        Evidence(id="e_spec", kind="unverified", text="관련 사양과 관리 방법은 아직 제품 자료로 확인되지 않았어요."),
    ]
    claims = [
        Claim(id="c_pro_1", side="pro", text="이 장면에서 기대하는 편익은 구매 이유와 연결돼요.", evidence_ids=["e_reason"]),
        Claim(id="c_con_1", side="con", text="장면의 조건과 관리 부담이 실제로도 감당할 만한지는 자료 확인이 필요해요.",
              evidence_ids=["e_scene", "e_spec"], replies_to="c_pro_1"),
    ]
    return Hearing(scene_id=scene_id, mode="mock", evidence=evidence, claims=claims, question=None, answered=None)


def mock_hearing(req: HearingRequest) -> Hearing:
    if req.scene_id not in SCENE_IDS[req.category]:
        raise HearingError("이 제품군에 없는 장면이에요.")
    if req.scene_id == "rv_clutter":
        if req.answer not in (None, "ok", "no", "skip"):
            raise HearingError("없는 선택지예요.")
        h = _rv_clutter(req.reason, req.answer)
    else:
        h = _generic(req.scene_id, req.reason)
    validate(h, set(req.source_ids))
    return h
