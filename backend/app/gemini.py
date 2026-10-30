"""Gemini REST 호출. 키는 헤더로만 보내고 오류 메시지·로그에 남기지 않는다."""

import json
import os
import threading
from datetime import datetime, timedelta, timezone

import httpx

URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
TIMEOUT = 25.0
RETRY_STATUS = {500, 502, 503, 504}  # 429(한도)는 바로 다시 보내도 소용없고 한도만 깎는다
# shortcut: 태평양 표준시 고정(UTC-8). 서머타임 땐 실제 초기화보다 1시간 늦게 풀린다. Windows엔 tzdata가 없어 ZoneInfo 못 씀.
PACIFIC = timezone(timedelta(hours=-8))


class GeminiError(RuntimeError):
    pass


# shortcut: 서버 메모리 카운터라 재시작하면 0부터. 여러 서버로 배포하면 공용 저장소로 옮긴다.
_lock = threading.Lock()
_usage = {"day": "", "count": 0, "exhausted": False}


def _take_quota() -> None:
    """하루 호출 상한(GEMINI_DAILY_LIMIT, 기본 15)을 넘거나 Google 한도(429)를 이미 맞았으면 보내지 않는다."""
    limit = int(os.getenv("GEMINI_DAILY_LIMIT", "15"))
    day = datetime.now(PACIFIC).date().isoformat()  # Google 무료 한도는 태평양 시간 자정에 초기화
    with _lock:
        if _usage["day"] != day:
            _usage.update(day=day, count=0, exhausted=False)
        if _usage["exhausted"] or _usage["count"] >= limit:
            raise GeminiError("오늘 AI 사용 한도를 다 썼어요.")
        _usage["count"] += 1


def _mark_exhausted() -> None:
    with _lock:
        _usage["exhausted"] = True


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
        _take_quota()
        try:
            r = httpx.post(URL.format(model=model), headers={"x-goog-api-key": key}, json=body, timeout=TIMEOUT)
        except httpx.HTTPError as e:
            last = f"AI 연결 실패({type(e).__name__})"
            continue
        if r.status_code == 429:
            _mark_exhausted()
            raise GeminiError("AI 사용 한도에 걸렸어요(429).")
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
