import os

from fastapi import FastAPI

from app.intake import EXAMPLE, IntakeRequest, Product, build_product

app = FastAPI(title="가전 구매 청문회 API")


def current_mode() -> str:
    # 실제 모드는 명시적으로 켜고 키도 있을 때만. 그 외엔 예시(mock) 모드로 표시한다.
    if os.getenv("APP_MODE") == "live" and os.getenv("GEMINI_API_KEY"):
        return "live"
    return "mock"


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": current_mode()}


@app.post("/api/intake")
def intake(req: IntakeRequest) -> Product:
    return build_product(req)


@app.get("/api/example")
def example() -> Product:
    return build_product(EXAMPLE, is_example=True)
