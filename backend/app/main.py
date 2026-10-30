import os

from fastapi import FastAPI, HTTPException

from app.gemini import GeminiError, generate_json
from app.hearing import MOCK_ANSWERS, Hearing, HearingError, HearingRequest, check_scene, live_hearing, mock_hearing
from app.intake import EXAMPLE, Category, IntakeRequest, Product, build_product
from app.catalog import CatalogSummary, load_catalog

app = FastAPI(title="살깡말깡 API")


def current_mode() -> str:
    # 실제 모드는 명시적으로 켜고 키도 있을 때만. 그 외엔 예시(mock) 모드로 표시한다.
    if os.getenv("APP_MODE") == "live" and os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_MODEL"):
        return "live"
    return "mock"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": current_mode()}


@app.post("/api/intake")
def intake(req: IntakeRequest) -> Product:
    try:
        return build_product(req, generate=generate_json if current_mode() == "live" else None)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))


@app.get("/api/catalog", response_model=list[CatalogSummary])
def catalog(category: Category | None = None):
    return [p for p in load_catalog() if category is None or p.category == category.value]


@app.get("/api/example")
def example() -> Product:
    return build_product(EXAMPLE, is_example=True)


@app.post("/api/hearing")
def hearing(req: HearingRequest) -> Hearing:
    try:
        check_scene(req)
        if current_mode() == "live":
            try:
                return live_hearing(req, generate_json)
            except GeminiError as e:
                # AI 실패·검증 실패는 예시 공방으로 대체하고 이유를 화면에 알린다.
                fallback = req.model_copy(update={"answer": req.answer if req.answer in MOCK_ANSWERS else None})
                return mock_hearing(fallback).model_copy(update={"notice": f"{e} 예시 공방으로 보여드려요."})
        return mock_hearing(req)
    except HearingError as e:
        raise HTTPException(status_code=422, detail=str(e))
