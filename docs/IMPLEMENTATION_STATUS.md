# 구현 상태

확인한 실행 결과만 적는다. 실행하지 않은 검사는 ‘미확인’으로 둔다.

마지막 갱신: 2026-10-30 · 브랜치 `feature/project-bootstrap`

## 구현·실행 확인됨

| 항목 | 확인 방법 | 결과 |
|---|---|---|
| 프론트 뼈대 (React 19 + TS + Vite 8) | `npm run lint`, `npm run build` | 통과 |
| 백엔드 뼈대 (FastAPI, uv) | `uv run pytest -q` | 3개 통과 (기본 mock / 키 없으면 live 거부 / 응답에 키 미노출) |
| 모드 표시 | 백엔드+프론트 실행, 브라우저에서 `/` 확인 | ‘예시 모드 · 실제 AI 응답 아님’ 표시 |
| Vite → API 프록시 | `curl localhost:5173/api/health` | `{"status":"ok","mode":"mock"}` |
| `scripts/setup.ps1`, `scripts/check.ps1` | 로컬 실행 | 통과 |

## 구현됐지만 미확인

| 항목 | 이유 |
|---|---|
| GitHub Actions CI (`.github/workflows/ci.yml`) | PR에서 첫 실행 전 |
| `scripts/dev.ps1` | 새 창을 여는 스크립트라 대화형으로 직접 실행해 보지 않음. 같은 명령은 개별 실행으로 확인 |

## 계획 (미착수)

5개 화면, 예시 제품 데이터, 도트 재생(12개 최소 상황), 장면 계획 검증, 청문회·주장 갱신, 결과·결정, Gemini 연동, 실패 처리, 반응형·접근성 확인, UT, 배포.

## 미확정

[SERVICE_DESIGN.md §12](SERVICE_DESIGN.md) 참고.
