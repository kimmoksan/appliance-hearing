# 도트 자산 규격·목록

재생 방식: **CSS 레이어** (배경 위에 제품·소품 PNG를 겹치고, 이동·깜빡임·회전·표시등은 코드로). 2026-10-30 결정.

**현재 상태 (2026-10-30)**: 목록 34장 전부 들어 있음 — 사용자 제공 자산 v01(31장) + 청문회 초상화 v02(`ui_pro`·`ui_con`·`ui_guide`). 크기·투명도(알파 0/255) 검사 통과. 장면 배치는 자산 패키지의 `scene_presets.json` 앵커 좌표를 왼쪽 위 좌표로 변환해 `frontend/src/scenes.ts`에 넣었다.

그림 파일이 없거나 깨지면 같은 파일명의 임시 상자로 보인다. 같은 파일명으로 덮어쓰면 교체된다.

## 1. 공통 규칙

| 항목 | 규칙 |
|---|---|
| 기준 화면 | **320 × 180 px** (16:9). 화면에선 정수 배율(×3~×4)로 확대 |
| 형식 | PNG. 배경 외에는 **투명 배경** |
| 픽셀 | 안티앨리어싱·블러 없음. 1px = 1도트 |
| 시점 | 시안 03번처럼 **정면에서 살짝 위**. 모든 그림 같은 시점·같은 바닥선 |
| 배율 | 모든 그림 같은 배율 (사람 키 ≈ 48px 기준) |
| 톤 | 시안처럼 따뜻한 실내 조명 + 남색 밤. 저녁/취침 톤은 코드로 덮어서 처리 |
| 글자 | 그림 안에 글자 넣지 않기 (설명은 화면 카드로) |
| 넣는 곳 | `frontend/public/assets/` 에 아래 파일명 그대로 |

배경에는 **움직이거나 껐다 켤 물건을 그리지 않는다** (청소기, 바닥 소품, 식기세척기 문 등). 그런 건 따로 그려야 움직일 수 있다.

## 2. 목록

크기는 320×180 기준 대략값. 조금 달라도 된다.

### 1차 (로봇청소기 3장면 — 이것부터)

| 파일명 | 내용 | 대략 크기 |
|---|---|---|
| `bg_living.png` | 거실 배경. 소파·테이블·러그·창문·스탠드. **바닥은 비워 두기** | 320×180 |
| `rv_body.png` | 로봇청소기 본체 | 28×12 |
| `rv_dock.png` | 충전 도크 (자동 비움 스테이션이면 그 모양) | 24×28 |
| `rv_dustbin.png` | 분리한 먼지통 | 12×10 |
| `rv_brush.png` | 분리한 브러시 | 14×6 |
| `prop_cable.png` | 바닥의 충전 케이블 | 24×8 |
| `prop_socks.png` | 바닥의 양말 | 12×8 |
| `prop_book.png` | 바닥의 책 | 14×6 |
| `prop_toy.png` | 바닥의 작은 장난감/공 | 8×8 |

### 2차 (식기세척기)

| 파일명 | 내용 | 대략 크기 |
|---|---|---|
| `bg_kitchen.png` | 주방 배경. 싱크대·조리대·식탁. **식기세척기 자리 비워 두기** | 320×180 |
| `dw_closed.png` | 식기세척기 문 닫힘 | 40×48 |
| `dw_open.png` | 문 열림 + 빈 랙 | 40×60 |
| `dw_open_loaded.png` | 문 열림 + 식기 찬 랙 | 40×60 |
| `dw_filter.png` | 분리한 필터 | 12×10 |
| `prop_dishes.png` | 조리대 위 식기 더미 | 28×16 |
| `prop_pot.png` | 큰 냄비 (적재 제약 표현) | 20×14 |

### 3차 (건조기)

| 파일명 | 내용 | 대략 크기 |
|---|---|---|
| `bg_laundry.png` | 세탁 공간. 세탁기·선반. **건조기 자리 비워 두기** | 320×180 |
| `dr_closed.png` | 건조기 문 닫힘 | 44×52 |
| `dr_open.png` | 문 열림 | 52×52 |
| `dr_drum.png` | 문 유리창 안 드럼 원형 (코드로 회전) | 20×20 |
| `dr_filter.png` | 먼지 필터 | 14×10 |
| `dr_watertank.png` | 물통 (방식에 따라 사용) | 14×10 |
| `prop_basket.png` | 빨래 바구니 | 24×18 |
| `prop_clothes.png` | 빨래 더미 | 24×12 |
| `prop_knit.png` | 니트 등 건조 주의 의류 | 16×12 |

### 4차 (공기청정기) — 배경은 `bg_living.png` 재사용

| 파일명 | 내용 | 대략 크기 |
|---|---|---|
| `ap_unit.png` | 공기청정기 본체 (표시등은 코드) | 20×40 |
| `ap_filter.png` | 새 필터 | 16×20 |
| `ap_filter_used.png` | 사용한 필터 (색 변화) | 16×20 |

### 선택 (있으면 좋음)

| 파일명 | 내용 | 대략 크기 |
|---|---|---|
| `char_stand.png` | 서 있는 사람 (정적) | 20×48 |
| `char_sit.png` | 소파에 앉은 사람 (정적) | 24×36 |
| `ui_pro.png` | 살깡이(찬성) 초상화 — v03 캐릭터, 투명 여백 자른 320px 이내 | 비정사각 가능 |
| `ui_con.png` | 말깡이(반대) 초상화 — v03 | 비정사각 가능 |
| `ui_guide.png` | 판깡이(진행) 초상화 — v03 | 비정사각 가능 |
| `logo_wordmark.png` | 헤더 글자 로고(집·말풍선 포함) — v03 | 높이 200px |
| `logo_mark.png` | 작은 아이콘(탭·모바일용) — v03 | 192px |
| `favicon.png` | 탭 아이콘(logo_mark 축소) | 64px |
| `intro_house.png` | 인트로 큰 그림 (시안 01번 집 단면) | 520×335 |

## 3. 코드로 만드는 것 (그림 불필요)

작동 표시등·깜빡임, 청소기 이동 경로, 드럼 회전, 바람 표시, 주의(!)·확인(✓)·시계 아이콘, 강조 테두리, 저녁/취침 톤.

## 4. 사용처 (장면 ID → 자산)

| 장면 | 배경 | 제품·소품 |
|---|---|---|
| rv_daily | bg_living | rv_body, rv_dock |
| rv_clutter | bg_living | rv_body, prop_cable, prop_socks, prop_book, prop_toy |
| rv_maintenance | bg_living | rv_dock, rv_dustbin, rv_brush |
| dw_load | bg_kitchen | dw_open_loaded → dw_closed, prop_dishes |
| dw_constraint | bg_kitchen | dw_open, prop_pot, prop_dishes |
| dw_maintenance | bg_kitchen | dw_open, dw_filter |
| dr_cycle | bg_laundry | dr_closed + dr_drum, prop_basket |
| dr_constraint | bg_laundry | dr_open, prop_clothes, prop_knit |
| dr_maintenance | bg_laundry | dr_open, dr_filter, dr_watertank |
| ap_run | bg_living | ap_unit |
| ap_night | bg_living (취침 톤) | ap_unit |
| ap_filter | bg_living | ap_unit, ap_filter, ap_filter_used |

## 깡이 동작 18종 (v04, 2026-10-30)

`frontend/public/assets/kkang/ui_{pro|con|guide}_{포즈}.png` — 원본 384×384를 18장 공통 범위(40,66)-(344,318)로 잘라 228×189로 축소(포즈가 바뀌어도 몸 위치가 튀지 않게). 정지 포즈를 바꿔 끼우고 CSS로 등장(pop)·들썩임(bob)을 준다. 동작 줄이기 설정이면 멈춤.

| 화면 | 연결 |
|---|---|
| 인트로 | 살깡이 wave · 판깡이 greet · 말깡이 curious |
| 공방 로딩 | 판깡이 moderate |
| 살깡이 발언 | 첫 주장 present · 반문 excited · 수정 think · 철회 shy |
| 말깡이 발언 | 첫 주장 curious · 반문 question · 미확인 근거 인용 inspect · 사용자 답 인용 note · 수정/철회 relieved |
| 판깡이 질문 | 답 전 present · 답 후 listen |
| 결과 | 이득 카드 pro_present · 불편 카드 con_note · 내 선택 guide_review → 고르면 guide_wave |

표정은 분위기만 전한다. 판정·승자·구매 권유로 쓰지 않는다. 기존 상반신 `ui_pro/ui_con/ui_guide.png`는 현재 화면에서 쓰지 않음(보관).
