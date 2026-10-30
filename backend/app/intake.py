"""제품 입력 검증과 제품 확인용 레코드 생성.

AI 연동 전 단계: 링크 본문과 사용자 텍스트를 출처로 보관하고, 스펙 값은 추측하지 않는다(모두 '확인 필요').
첫 줄이 링크면 그 페이지를 읽고, 나머지 줄은 사용자가 덧붙인 자료로 본다.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.catalog import load_catalog
from app.link_reader import LinkError, is_url, read_link


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
    catalog_model: str | None = Field(default=None, min_length=1, max_length=120)
    product_text: str = Field(default="", max_length=PRODUCT_TEXT_MAX)
    reason: str = Field(min_length=1, max_length=REASON_MAX)

    @field_validator("product_text", "reason")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        return v

    @model_validator(mode="after")
    def required_inputs(self):
        if not self.reason or (not self.catalog_model and not self.product_text):
            raise ValueError("제품 정보와 구매 이유를 입력해 주세요.")
        return self


class Spec(BaseModel):
    key: str
    label: str
    value: str | None
    status: Literal["confirmed", "needs_check"]
    source_id: str | None


class Source(BaseModel):
    id: str
    kind: Literal["user_input", "example", "link", "catalog"]
    text: str
    url: str | None = None
    received_at: str
    checked_at: str | None = None


class Product(BaseModel):
    category: Category
    name: str
    is_example: bool
    link: str | None
    link_read: bool
    reason: str
    specs: list[Spec]
    sources: list[Source]
    notices: list[str]


def build_product(req: IntakeRequest, *, is_example: bool = False) -> Product:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    if req.catalog_model:
        item = next((p for p in load_catalog() if p.model == req.catalog_model), None)
        if item is None or item.category != req.category.value:
            raise ValueError("선택한 제품이 목록에 없거나 제품군이 달라요. 다시 선택해 주세요.")
        source = Source(
            id="src_catalog", kind="catalog", text="\n".join(f"{k}: {v}" for k, v in item.p.items()),
            url=str(item.url), received_at=now, checked_at=item.checked_at.isoformat(),
        )
        sources = [source]
        if req.product_text:
            sources.append(Source(id="src_user", kind="user_input", text=req.product_text, received_at=now))
        specs = [Spec(
            key=k, label=k, value=v,
            status="needs_check" if v.strip() in {"미확인", "확인 필요", ""} else "confirmed",
            source_id=source.id,
        ) for k, v in item.p.items()]
        notices = ["사양은 제조사 공식 자료를 확인한 내용이에요. 실제 찬반 공방은 예시 모드로 진행돼요."]
        if item.status == "단종":
            notices.append("단종으로 기록된 제품이에요. 현재 판매·지원 여부는 별도 확인이 필요해요.")
        return Product(
            category=req.category, name=f"{item.name} ({item.model})", is_example=False,
            link=str(item.url), link_read=False, reason=req.reason, specs=specs, sources=sources, notices=notices,
        )
    first, _, rest = req.product_text.partition("\n")
    first, rest = first.strip(), rest.strip()
    link = first if is_url(first) else None
    user_text = rest if link else req.product_text

    sources: list[Source] = []
    notices: list[str] = []
    name = ""
    if link:
        try:
            page_name, page_text = read_link(link)
            sources.append(Source(id=f"src_{len(sources) + 1}", kind="link", text=page_text, url=link, received_at=now))
            name = page_name
            notices.append("링크에서 읽은 내용이에요. 사양은 아직 확인 전이라 ‘확인 필요’로 둬요.")
        except LinkError as e:
            notices.append(f"링크를 읽지 못했어요: {e} 필요하면 제품 정보를 붙여넣어 주세요(선택).")
    if user_text:
        sources.append(Source(
            id=f"src_{len(sources) + 1}", kind="example" if is_example else "user_input", text=user_text, received_at=now,
        ))
        name = name or user_text.splitlines()[0].strip()
    name = (name or "링크로 입력한 제품")[:NAME_MAX]

    specs = [
        Spec(key=k, label=label, value=None, status="needs_check", source_id=None)
        for k, label in SPEC_FIELDS[req.category]
    ]
    return Product(
        category=req.category,
        name=name,
        is_example=is_example,
        link=link,
        link_read=any(s.kind == "link" for s in sources),
        reason=req.reason,
        specs=specs,
        sources=sources,
        notices=notices,
    )


EXAMPLE = IntakeRequest(
    category=Category.robot_vacuum,
    product_text="로봇청소기 A (예시 제품 · 실제 모델 아님)\n자동 비움 스테이션 포함 여부, 크기, 관리 방법은 자료 확인 필요.",
    reason="퇴근 후 청소 부담을 줄이고 싶어요.",
)
