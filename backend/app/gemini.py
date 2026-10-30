"""Gemini REST 호출. 키는 헤더로만 보내고 오류 메시지·로그에 남기지 않는다."""

import json
import os

import httpx

URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
TIMEOUT = 25.0
RETRY_STATUS = {429, 500, 502, 503, 504}


class GeminiError(RuntimeError):
    pass


def generate_json(prompt: str, attempts: int = 2) -> dict:
    """JSON 객체 하나를 받는다. 네트워크·일시 오류만 한 번 더 시도한다."""
    key = os.getenv("GEMINI_API_KEY", "").strip()
    model = os.getenv("GEMINI_MODEL", "").strip()
    if not key or not model:
        raise GeminiError("AI 설정이 없어요.")
    body = {
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        # shortcut: thinkingLevel은 Gemini 3 계열 기준(기본값은 25초를 넘김). 다른 계열을 쓰면 여기서 400이 난다.
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.4, "thinkingConfig": {"thinkingLevel": "low"}},
    }
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
            text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
            data = json.loads(text)
        except (KeyError, IndexError, TypeError, ValueError):
            raise GeminiError("AI 응답 형식이 올바르지 않아요.")
        if not isinstance(data, dict):
            raise GeminiError("AI 응답 형식이 올바르지 않아요.")
        return data
    raise GeminiError(last)
