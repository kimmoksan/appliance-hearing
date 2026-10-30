# 가전 구매 청문회 (가칭: 가전 구매 판단 시뮬레이터)

제품 정보와 구매 이유 한 줄을 넣으면 사용 상황 3개를 도트 예시 장면으로 보여주고, 근거가 연결된 찬반 청문회를 거쳐 **사용자가 직접** 구매 / 비구매 / 추가 조사를 결정하도록 돕는 웹 서비스. AI가 판결하거나 점수를 매기지 않는다.

> 현재 상태: 개발 환경 뼈대만 있음. 실제 진행은 [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

## 지원 범위

- 제품군: 로봇청소기 · 식기세척기 · 건조기 · 공기청정기
- 입력: 제품명·모델명·스펙 붙여넣기 + 구매 이유 한 줄 (링크는 지원 사이트를 정한 뒤)
- 도트 장면은 **상황 이해용 예시**다. 실제 집 구조·축척·제품 성능을 재현하지 않는다.
- 데이터는 현재 탭 안에서만. 회원·저장·공유·업로드·비교는 이번 범위 밖.

## 예시 모드 / 실제 AI 모드

| 모드 | 조건 | 화면 표시 |
|---|---|---|
| 예시(mock) | 기본값. 키 불필요 | ‘예시 모드 · 실제 AI 응답 아님’ |
| 실제(live) | `backend/.env`에 `APP_MODE=live` + `GEMINI_API_KEY` | ‘실제 AI 모드’ |

키는 `backend/.env`에만 넣는다. 커밋·프론트 변수(`VITE_*`)에 넣지 않는다. (Gemini 연동은 아직 미구현)

## 실행 (Windows PowerShell)

필요: Node 22+, Python 3.12, [uv](https://docs.astral.sh/uv/)

```powershell
./scripts/setup.ps1   # 최초 1회: 의존성 설치 + backend/.env 생성
./scripts/dev.ps1     # 백엔드 :8000 (새 창) + 프론트 :5173
./scripts/check.ps1   # PR 전 검사: lint · build · pytest
```

실행 정책 오류가 나면 `powershell -ExecutionPolicy Bypass -File scripts/dev.ps1`.

## 구조

```
frontend/   React + TypeScript + Vite (/api → :8000 프록시)
backend/    FastAPI (uv). app/main.py, tests/
scripts/    setup · dev · check
docs/       설계 · MoSCoW · 구현 상태 · 보고서 · 와이어프레임
```

## 시연 순서 (목표 흐름, 미구현)

인트로에서 예시 제품 선택 → 제품 확인 → 상황 1~3 → 청문회(근거 펼치기, 질문 1개 답변 또는 건너뛰기) → 결과에서 직접 결정.

## 문서

- [docs/SERVICE_DESIGN.md](docs/SERVICE_DESIGN.md) — 서비스 설계·도트 표현·AI 규칙
- [docs/MOSCOW.md](docs/MOSCOW.md) — 우선순위 (확정 / 현재 선택 / 미확정 제안)
- [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) — 확인된 실행 결과
- [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md) — AX 개인 프로젝트 보고 6항목
- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) — 브랜치·PR 규칙
