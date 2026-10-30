"""수동 검수한 카탈로그만 읽는다. 자료 오류가 서버 시작을 막지 않는다."""

import json
import logging
from datetime import date
from pathlib import Path

from pydantic import AnyHttpUrl, BaseModel, Field, StrictStr, TypeAdapter, ValidationError

CATALOG_PATH = Path(__file__).resolve().parents[2] / "docs" / "catalog" / "catalog_v0.json"
logger = logging.getLogger(__name__)


class CatalogSummary(BaseModel):
    brand: StrictStr = Field(min_length=1)
    model: StrictStr = Field(min_length=1)
    name: StrictStr = Field(min_length=1)
    url: AnyHttpUrl
    status: StrictStr = Field(min_length=1)


class CatalogEntry(CatalogSummary):
    category: StrictStr
    p: dict[str, StrictStr]
    checked_at: date


def load_catalog() -> list[CatalogEntry]:
    try:
        data = json.loads(CATALOG_PATH.read_text(encoding="utf-8-sig"))
        items = TypeAdapter(list[CatalogEntry]).validate_python(data)
        models = [p.model for p in items]
        if len(models) != len(set(models)) or any(
            p.category not in {"robot_vacuum", "dishwasher", "dryer", "air_purifier"} for p in items
        ):
            raise ValueError("모델 또는 제품군이 올바르지 않아요.")
        return items
    except (OSError, UnicodeError, ValueError, ValidationError):
        logger.warning("제품 카탈로그를 읽지 못해 빈 목록을 사용합니다.")
        return []
