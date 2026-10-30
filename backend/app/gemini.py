"""Gemini REST 호출. 키는 헤더로만 보내고 오류 메시지·로그에 남기지 않는다."""

import json
import os

import httpx

URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
TIMEOUT = 25.0
RETRY_STATUS = {500, 502, 503, 504}  # 429(한도)는 바로 다시 보내도 소용없고 한도만 깎는다


class GeminiError(RuntimeError):
    pass


def generate_json(prompt: str, attempts: int = 2, search: bool = False) -> dict:
    """JSON 객체 하나를 받는다. 네트워크·일시 오류만 한 번 더 시도한다.

    search=True면 Google 검색 그라운딩을 켜고, 실제로 참고한 웹 출처를 data["_sources"]에 넣는다.
    """
    key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "").strip()
    if not key or not model:
        raise GeminiError("AI 설정이 없어요.")
    # shortcut: thinkingLevel은 Gemini 3 계열 기준(기본값은 25초를 넘김). 다른 계열을 쓰면 여기서 400이 난다.
    config = {"temperature": 0.4, "thinkingConfig": {"thinkingLevel": "low"}}
    body = {"contents": [{"role": "user", "parts": [{"text": prompt}]}], "generationConfig": config}
    if search:
        body["tools"] = [{"google_search": {}}]  # 검색 도구와 JSON 응답 모드는 함께 못 써서 텍스트에서 JSON을 꺼낸다
    else:
        config["responseMimeType"] = "application/json"
    last = "AI 응답을 받지 못했어요."
    for _ in range(attempts):
        try:
            r = httpx.post(URL.format(model=model), headers={"x-goog-api-key": key}, json=body, timeout=TIMEOUT)
        except httpx.HTTPError as e:
            last = f"AI 연결 실패({type(e).__name__})"
            continue
        if r.status_code in RETRY_STATUS:
            last = f"AI 서버 응답 {r.status_code}"
            continue
        if r.status_code != 200:
            raise GeminiError(f"AI 서버 응답 {r.status_code}")
        try:
            cand = r.json()["candidates"][0]
            text = "".join(p.get("text", "") for p in cand["content"]["parts"])
            data = json.loads(text[text.find("{"): text.rfind("}") + 1])
        except (KeyError, IndexError, TypeError, ValueError):
            raise GeminiError("AI 응답 형식이 올바르지 않아요.")
        if not isinstance(data, dict):
            raise GeminiError("AI 응답 형식이 올바르지 않아요.")
        if search:
            chunks = cand.get("groundingMetadata", {}).get("groundingChunks", [])
            data["_sources"] = [c["web"] for c in chunks if isinstance(c.get("web"), dict) and c["web"].get("uri")]
        return data
    raise GeminiError(last)
