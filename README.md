# 살깡말깡 — 가전 살까 말까 청문회

제품 정보와 구매 이유 한 줄을 넣으면 사용 상황 3개를 도트 예시 장면으로 보여주고, 근거가 연결된 찬반 청문회를 거쳐 **사용자가 직접** 구매 / 비구매 / 추가 조사를 결정하도록 돕는 웹 서비스. AI가 판결하거나 점수를 매기지 않는다.

> 현재 상태: 인트로·제품 확인 화면까지. 상황·청문회·결과와 AI 연동은 미구현. 실제 진행은 [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

## 지원 범위

- 제품군: 로봇청소기 · 식기세척기 · 건조기 · 공기청정기
- 입력: 제품 링크 또는 제품명·스펙 붙여넣기 + 구매 이유 한 줄. 링크는 서버가 읽음(봇 차단 사이트는 못 읽을 수 있음)
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
./scripts/check.ps1   # PR 전 검사: lint · 프론트 요약 테스트 · build · pytest
```

실행 정책 오류가 나면 `powershell -ExecutionPolicy Bypass -File scripts/dev.ps1`.

## 구조

```
frontend/   React + TypeScript + Vite (/api → :8000 프록시)
backend/    FastAPI (uv). app/main.py, tests/
scripts/    setup · dev · check
docs/       설계 · MoSCoW · 구현 상태 · 보고서 · 와이어프레임
```

## 시연 순서 (예시 모드)

인트로에서 예시 제품 선택 → 제품 확인 → 상황 1~3 → 청문회(근거 펼치기, 질문 1개 답변 또는 건너뛰기) → 결과에서 직접 결정.

## 카탈로그로 제품 선택

기본 입력은 제품군 → 브랜드 → 모델 선택과 구매 이유 한 줄이다. 목록에 없는 제품은 ‘목록에 없어요 · 직접 입력하기’로 기존 링크/정보 입력을 사용한다.

- `GET /api/catalog?category=robot_vacuum`: brand, model, name, url, status 목록. category 생략 시 전체, 지원하지 않는 제품군은 422.
- `POST /api/intake`: category·reason은 필수이며, catalog_model을 보내면 product_text 없이 카탈로그 모델을 선택할 수 있다. 없는 모델이나 제품군이 다른 모델은 422. catalog_model이 없으면 기존 product_text가 필수다.
- 카탈로그 p의 키·값을 그대로 Spec에 담고, 출처 kind=catalog에 공식 URL·checked_at을 연결한다. 미확인 값은 needs_check로 유지한다. 직접 추가한 텍스트는 별도 사용자 출처로 보관한다.
- `docs/catalog/catalog_v0.json`을 읽는다. 파일 누락·잘못된 JSON/스키마·중복 모델이면 빈 목록으로 복구한다. 화면에서는 직접 입력으로 이어갈 수 있다.
- 카탈로그 원본은 이번 기능 커밋에 포함하지 않는다. 별도 관리되는 검수 파일을 실행할 체크아웃의 같은 경로에 준비해야 실제 제품이 표시된다. 자동 테스트는 `backend/tests/fixtures/catalog.json`만 사용한다.

## 결과와 내 결정

결과는 확인한 장면의 공방을 이득 / 불편 / 확인 필요로 모은다. 판결·점수·승자나 구매 추천은 만들지 않는다. 사용자가 살래요 / 보류 / 안 살래요를 직접 고르고 요약을 복사한다. 선택은 기본값이 없고 현재 탭에서만 유지된다.

- 질문 답변과 최신 주장·수정 이유를 반영하며, 철회한 주장은 별도로 표시한다. 건너뛰거나 답하지 않은 질문은 ‘확인 안 함’으로 남긴다.
- 답변을 바꾸면 그 장면의 공방을 다시 받아 요약을 갱신하고, 이전 구매 선택을 초기화한다. 새 제품 검토도 이전 답변·선택을 지운다.
- 보지 않은 장면과 미확인 사양은 확인 필요에 남긴다. 결과·복사 내용 모두 예시 표시, 가정/미확인 구분과 제공된 출처를 유지한다.
- 자동 복사가 실패하면 직접 복사할 텍스트를 제공한다. 실제 AI 요약·서버 저장·영구 보관은 구현하지 않았다.
- `cd frontend; npm run test`는 Node 기본 테스트로 요약·근거 연결·답변 상태·복사 내용을 검사한다. 별도 의존성은 없다.

## 설계 문서

- [docs/SERVICE_DESIGN.md](docs/SERVICE_DESIGN.md) — 서비스 설계·도트 표현·AI 규칙
- [docs/MOSCOW.md](docs/MOSCOW.md) — 우선순위 (확정 / 현재 선택 / 미확정 제안)
- [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) — 확인된 실행 결과
- [docs/PROJECT_REPORT.md](docs/PROJECT_REPORT.md) — AX 개인 프로젝트 보고 6항목
- [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) — 브랜치·PR 규칙
