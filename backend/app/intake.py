"""제품 입력 검증과 제품 확인용 레코드 생성.

AI 연동 전 단계: 사용자가 준 텍스트를 그대로 출처로 보관하고, 스펙 값은 추측하지 않는다(모두 '확인 필요').
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class Category(str, Enum):
    robot_vacuum = "robot_vacuum"
    dishwasher = "dishwasher"
    dryer = "dryer"
    air_purifier = "air_purifier"


# 제품 확인 화면에 보여줄 항목 이름만 정한다. 값은 자료에서 확인될 때까지 비워 둔다.
SPEC_FIELDS: dict[Category, list[tuple[str, str]]] = {
    Category.robot_vacuum: [("size", "제품 크기"), ("cleaning", "청소 방식"), ("auto_empty", "자동 비움"), ("care", "관리 방법")],
    Category.dishwasher: [("size", "설치 크기"), ("capacity", "식기 용량"), ("install", "설치 방식"), ("care", "필터 관리")],
    Category.dryer: [("size", "제품 크기"), ("capacity", "건조 용량"), ("drying", "건조 방식"), ("care", "필터·물통 관리")],
    Category.air_purifier: [("size", "제품 크기"), ("coverage", "사용 면적"), ("filter", "필터 종류"), ("care", "필터 교체")],
}

PRODUCT_TEXT_MAX = 5000
REASON_MAX = 200
NAME_MAX = 80


class IntakeRequest(BaseModel):
    category: Category
    product_text: str = Field(min_length=1, max_length=PRODUCT_TEXT_MAX)
    reason: str = Field(min_length=1, max_length=REASON_MAX)

    @field_validator("product_text", "reason")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("공백만 입력할 수 없어요")
        return v


class Spec(BaseModel):
    key: str
    label: str
    value: str | None
    status: Literal["confirmed", "needs_check"]
    source_id: str | None


class Source(BaseModel):
    id: str
    kind: Literal["user_input", "example"]
    text: str
    received_at: str


class Product(BaseModel):
    category: Category
    name: str
    is_example: bool
    link_only: bool
    reason: str
    specs: list[Spec]
    sources: list[Source]
    notices: list[str]


def _is_link_only(text: str) -> bool:
    return " " not in text and "\n" not in text and text.lower().startswith(("http://", "https://"))


def build_product(req: IntakeRequest, *, is_example: bool = False) -> Product:
    text = req.product_text
    link_only = _is_link_only(text)
    notices = []
    if link_only:
        # shortcut: 링크 본문 읽기 미구현(지원 사이트 미정). 사이트를 정하면 URL 보호와 함께 추가.
        notices.append("링크 내용은 아직 읽지 않아요. 제품 페이지의 모델명·사양을 복사해 붙여넣어 주세요.")
        name = "링크로 입력한 제품"
    else:
        name = text.splitlines()[0].strip()[:NAME_MAX]
    source = Source(
        id="src_1",
        kind="example" if is_example else "user_input",
        text=text,
        received_at=datetime.now(timezone.utc).isoformat(timespec="seconds"),
    )
    specs = [
        Spec(key=k, label=label, value=None, status="needs_check", source_id=None)
        for k, label in SPEC_FIELDS[req.category]
    ]
    return Product(
        category=req.category,
        name=name,
        is_example=is_example,
        link_only=link_only,
        reason=req.reason,
        specs=specs,
        sources=[source],
        notices=notices,
    )


EXAMPLE = IntakeRequest(
    category=Category.robot_vacuum,
    product_text="로봇청소기 A (예시 제품 · 실제 모델 아님)\n자동 비움 스테이션 포함 여부, 크기, 관리 방법은 자료 확인 필요.",
    reason="퇴근 후 청소 부담을 줄이고 싶어요.",
)
