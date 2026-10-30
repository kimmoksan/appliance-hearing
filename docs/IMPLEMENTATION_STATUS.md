# 구현 상태

확인한 실행 결과만 적는다. 실행하지 않은 검사는 ‘미확인’으로 둔다.

마지막 갱신: 2026-10-30 · 브랜치 `feature/scene-player`

## 구현·실행 확인됨

| 항목 | 확인 방법 | 결과 |
|---|---|---|
| 프론트 뼈대 (React 19 + TS + Vite 8) | `npm run lint`, `npm run build` | 통과 |
| 백엔드 (FastAPI, uv) | `uv run pytest -q` | 19개 통과 |
| 모드 표시 | 브라우저 | ‘예시 모드 · 실제 AI 응답 아님’ |
| CI (GitHub Actions) | PR #2, #3 | frontend·backend 통과 |
| 입력 검증 API `POST /api/intake` | pytest + Swagger 수동 확인(사용자) | 제품군·빈칸·길이 위반 422 |
| 예시 제품 `GET /api/example` | pytest + 수동 확인(사용자) | 예시 표시, 스펙 추측 없음 |
| 링크 읽기 | pytest(차단 주소 8종·추출·빈 페이지) + 실제 사이트 | LG·삼성 목록 페이지 읽힘, 쿠팡 403 → 사유 안내 |
| 인트로·입력 화면 | 브라우저 (PC 1440/1920, 태블릿 900, 모바일 375) | 빈칸 오류, 예시 시작, 입력 보존, 가로 스크롤 없음 |
| 제품 확인 화면 | 브라우저 | 스펙 ‘확인 필요’, 출처별 원문 보기, 이유 수정, 자료 추가(선택), 5000자 초과 시 한국어 오류, 실패 시 입력·붙여넣기 유지 |
| 도트 자산 34장 | 크기·알파 검사 스크립트 | 규격 일치, 알파 0/255 |
| 상황 화면·재생기 (CSS 레이어) | 브라우저 (1440, 375) | 4개 제품군 12장면 모든 이미지 로드, 청소기 경로 이동, 식기세척기 상태 교체(열림→적재→닫힘), 건조기 드럼 회전, 공기청정기 표시등, 취침 톤, 움직임 멈추기(교체·이동 모두 정지), 상황 1·2·3 이동 |
| 인트로 그림 | 브라우저 | intro_house 표시 |

## 구현됐지만 미확인

| 항목 | 이유 |
|---|---|
| `scripts/dev.ps1` | 새 창을 여는 스크립트라 대화형으로 직접 실행해 보지 않음 |
| 링크 읽기 — 개별 제품 상세 페이지 | 목록 페이지로만 확인. 제조사 상세 페이지별 차이는 미확인 |
| DNS rebinding 방어 | 미구현 (코드에 shortcut 표시). 공개 배포 전 보강 |

## 계획 (미착수)

장면 계획 검증(AI가 고른 장면·소품 허용값 검사), 청문회·주장 갱신, 결과·결정(탭 안 요약·복사), Gemini 연동(스펙 추출 포함), 반응형·접근성 전체 점검, UT, 배포.

## 미확정

[SERVICE_DESIGN.md §12](SERVICE_DESIGN.md) 참고.

## 2026-10-30 카탈로그 검증·개발 인계 보충

현재 브랜치는 `feature/hearing`, HEAD `60e27e5`. 위 scene-player 시점 기록 중 청문회 미착수·백엔드 19개 항목은 현재 코드보다 오래된 기록이다. 코드에는 예시 청문회 API·화면, 인트로 애니메이션, 링크 읽기의 로그인 페이지 차단이 들어 있다. 이번에는 브라우저 수동 UI 검증을 새로 수행하지 않았다.

- 카탈로그: 삼성·LG × 4개 제품군 × 3개, 총 24개. 공식 상세 스펙과 실제 판매 페이지를 각각 확인했다. 273개 사양 필드 중 271개 공식 표 대응, 의미가 모호한 2개는 `미확인`. [근거·출처·한계](catalog/VERIFICATION.md).
- `./scripts/check.ps1`: 프론트 lint·타입·빌드 통과, 백엔드 **29 passed, 1 warning**. 첫 실행의 uv 기본 캐시 접근 실패 후 UV_CACHE_DIR를 조사 작업 공간의 work/uv-cache로 지정해 같은 스크립트를 재실행하여 전체 통과했다. 경고는 기존 TestClient/httpx 사용 중단 예정 안내다.
- 이번 수정은 카탈로그 데이터·관련 문서뿐이다. 앱에 카탈로그를 연결하거나 기능 코드를 변경하지 않았다.
- 개발 문서 9개와 PR 템플릿을 읽고 [다음 개발 인계](catalog/DEVELOPMENT_HANDOFF.md)에 실제 코드와 문서의 차이, 미확인 처리, 다음 작업 순서를 기록했다.
- 사용자 지시대로 PR·CI·머지, feature/catalog, 결과 요약 구현은 아직 시작하지 않았다. 다음 개발은 사용자와 단계별 테스트하며 진행한다. 사용자의 후속 지시에 따라 docs/catalog와 이 상태 문서를 별도 커밋·푸시 대상으로 변경했다.

## 1단계 청문회 PR 완료 (2026-10-30)

- PR [#6](https://github.com/kimmoksan/appliance-hearing/pull/6): `codex/hearing-pr` → `develop`, 머지 완료. 머지 커밋 `f677fc88709df060e871471e6a4e68a21af9cbe6`.
- 카탈로그 커밋 `5c277b0`은 PR에서 제외했다. 기존 feature/hearing과 카탈로그를 보존하고 `60e27e5`에서 PR용 브랜치를 분리했다.
- 로컬 `./scripts/check.ps1`: lint·타입·빌드 통과, 백엔드 29 passed / 기존 경고 1개. [PR CI](https://github.com/kimmoksan/appliance-hearing/actions/runs/41008687025)의 frontend·backend 모두 성공.
- 검사한 HEAD `c889531258d2ac2607e6a016962d6001d9952b80`을 지정해 머지했다. gh 명령은 로컬 인증 401로 실패하여 GitHub 도구의 expected_head_sha 검증으로 같은 커밋 일치 조건을 적용했다.
- GitHub 커넥터에 저장소 접근을 설정한 뒤 원격 브랜치 생성·문서 커밋·PR 생성·머지가 정상 동작했다. 저장소는 public이다. 터미널 gh 인증과는 별도다.
- 브라우저 수동 UI 검증은 미실행. rv_clutter 외 공방은 공통 예시이며 실제 AI·카탈로그 연결·결과 화면은 미구현이다.
- 단계별 사용자 테스트를 위해 2단계 feature/catalog 구현은 아직 시작하지 않았다. 이 완료 기록은 원래 feature/hearing 브랜치에 남겨 후속 작업에서 참고한다.

## 2단계 카탈로그 선택 완료 (2026-10-30)

- PR [#7](https://github.com/kimmoksan/appliance-hearing/pull/7): feature/catalog → develop, 머지 완료. 머지 커밋 `0247b3e75b0954303b5a004b915674eb3e5bdb9d`, 검사한 HEAD `dab616305d4ca9a685d083d5133b1ae6de73f029`.
- 기본 입력은 제품군→브랜드→모델이다. 공식 사양·URL·확인일을 연결하고 미확인은 확인 필요로 유지한다. 목록 밖 직접 입력, 양쪽 경로 구매 이유 필수, 단종 표시, 누락/깨진 카탈로그 빈 목록 복구를 구현했다.
- ./scripts/check.ps1: lint·타입·빌드 통과, 백엔드 43 passed / 기존 경고 1개. [CI](https://github.com/kimmoksan/appliance-hearing/actions/runs/41009984278)의 frontend·backend 모두 성공.
- 실행 API로 실제 24개 모델의 사양·확인일 보존, 제품군별 6개, 미확인 2개 유지를 확인했다. 브라우저에서 선택·이유 필수·이유 수정 후 모델 유지·직접 입력·LG 미확인 표시, 375px 가로 넘침 없음, 콘솔 오류 없음을 확인했다.
- docs/catalog 원본은 수정·기능 커밋하지 않았다. 별도 worktree에 같은 바이트 사본을 로컬 실행용으로 둔다. 새 체크아웃에는 검수 파일을 별도로 제공해야 하며, 파일이 없으면 빈 목록과 직접 입력 안내가 정상 동작이다.
- 현재 테스트 서버는 별도 worktree `C:/Users/kjca022/Documents/Codex/2026-10-30/c-agents-md-claude-md-readme/work/catalog`의 feature/catalog 코드에서 실행한다. 화면 http://127.0.0.1:5173/, 예시 API 8001. 기존 8000 프로세스는 종료하지 않았다. 원래 C:/KMS/appliance-hearing의 feature/hearing 코드·카탈로그도 보존한다.
- 남은 한계: 실제 AI와 결과 요약 미구현, 실데이터에 단종 모델이 없어 해당 브라우저 경로는 미검증(API/안내는 fixture 테스트로 확인), 전체 접근성/브라우저 검증은 별도. 3단계 개발은 시작하지 않았다.
