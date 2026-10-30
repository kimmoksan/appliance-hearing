"""사용자(IP)별 요청 제한. 링크 읽기·AI 호출처럼 비용이 드는 API를 한 사람이 몰아 쓰지 못하게 한다."""

import os
import threading
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

WINDOW_SEC = 60
_lock = threading.Lock()
_hits: dict[str, deque[float]] = defaultdict(deque)


def limit(request: Request) -> None:
    # shortcut: 서버 메모리·직접 접속 IP 기준. 프록시 뒤에 배포하면 X-Forwarded-For(신뢰 프록시만)와 공용 저장소로 바꾼다.
    per_min = int(os.getenv("RATE_LIMIT_PER_MIN", "12"))
    key = f"{request.url.path}:{request.client.host if request.client else '-'}"
    now = time.monotonic()
    with _lock:
        q = _hits[key]
        while q and now - q[0] > WINDOW_SEC:
            q.popleft()
        if len(q) >= per_min:
            raise HTTPException(status_code=429, detail="요청이 너무 잦아요. 1분쯤 뒤에 다시 시도해 주세요.")
        q.append(now)
