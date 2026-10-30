import type { Category } from './types'

// 좌표·크기는 기준 화면 320×180 px, 왼쪽 위 기준 (docs/ASSETS.md).
// 배치는 자산 패키지 scene_presets.json의 앵커 좌표를 왼쪽 위로 변환한 값.
export type Layer = {
  asset: string
  x: number
  y: number
  w: number
  h: number
  path?: [number, number][] // 순서대로 이동 후 반복
  frames?: [string, number][] // [자산, 높이]를 시간차로 교체 (같은 왼쪽 위 기준)
  effect?: 'blink' | 'warn' | 'check' | 'spin' | 'led'
}

export type Scene = {
  id: string
  title: string
  caption: string
  background: string
  tone?: 'night'
  layers: Layer[]
  assumption: string
  needsCheck: string
}

const DOCK: Layer = { asset: 'rv_dock', x: 274, y: 101, w: 24, h: 28 }
const VACUUM_PATH: [number, number][] = [[58, 140], [116, 149], [206, 152], [241, 133], [206, 152], [116, 149], [58, 140]]
const AIR: Layer = { asset: 'ap_unit', x: 271, y: 89, w: 20, h: 40, effect: 'led' }

const ROBOT_VACUUM: Scene[] = [
  {
    id: 'rv_daily',
    title: '일상 청소',
    caption: '청소기가 정해진 경로로 바닥을 도는 모습을 살펴봐요.',
    background: 'bg_living',
    layers: [DOCK, { asset: 'rv_body', x: 58, y: 140, w: 28, h: 12, path: VACUUM_PATH, effect: 'blink' }],
    assumption: '바닥에 걸리는 물건이 없는 경우',
    needsCheck: '실제 청소 범위와 걸리는 시간은 제품 자료로 확인해야 해요.',
  },
  {
    id: 'rv_clutter',
    title: '바닥 정리 부담',
    caption: '바닥에 작은 물건이 놓여 있는 경우를 살펴봐요.',
    background: 'bg_living',
    layers: [
      DOCK,
      { asset: 'prop_cable', x: 222, y: 152, w: 24, h: 8 },
      { asset: 'prop_socks', x: 167, y: 146, w: 12, h: 8 },
      { asset: 'prop_book', x: 184, y: 154, w: 14, h: 6 },
      { asset: 'prop_toy', x: 136, y: 162, w: 8, h: 8 },
      // 물건 앞에서 멈췄다가 돌아가는 것까지만. 실제 회피 성능을 표현하지 않는다.
      { asset: 'rv_body', x: 85, y: 146, w: 28, h: 12, path: [[85, 146], [104, 148], [104, 148], [85, 146]], effect: 'warn' },
    ],
    assumption: '양말·책·케이블 같은 작은 물건이 바닥에 있음',
    needsCheck: '작은 물건을 인식하고 피하는지는 제품마다 달라요.',
  },
  {
    id: 'rv_maintenance',
    title: '사용 후 관리',
    caption: '먼지통을 비우고 브러시를 청소하는 관리 작업을 살펴봐요.',
    background: 'bg_living',
    layers: [
      DOCK,
      { asset: 'rv_body', x: 85, y: 146, w: 28, h: 12 },
      { asset: 'rv_dustbin', x: 167, y: 144, w: 12, h: 10, effect: 'check' },
      { asset: 'rv_brush', x: 191, y: 155, w: 14, h: 6, effect: 'check' },
    ],
    assumption: '주기적으로 먼지통을 비우고 브러시를 청소하는 경우',
    needsCheck: '자동 비움 여부와 관리 주기는 설명서로 확인해야 해요.',
  },
]

const DISHWASHER: Scene[] = [
  {
    id: 'dw_load',
    title: '식사 후 적재',
    caption: '식사 후 식기를 넣고 문을 닫는 과정을 살펴봐요.',
    background: 'bg_kitchen',
    layers: [
      { asset: 'dw_open', x: 221, y: 65, w: 40, h: 60, frames: [['dw_open', 60], ['dw_open_loaded', 60], ['dw_closed', 48]] },
      { asset: 'prop_dishes', x: 150, y: 49, w: 28, h: 16 },
    ],
    assumption: '한 번에 모아서 넣을 만큼 식기가 나오는 경우',
    needsCheck: '한 번에 넣을 수 있는 식기 양은 제품 용량 자료로 확인해야 해요.',
  },
  {
    id: 'dw_constraint',
    title: '적재 제약',
    caption: '큰 냄비처럼 넣기 어려운 식기가 있는 경우를 살펴봐요.',
    background: 'bg_kitchen',
    layers: [
      { asset: 'dw_open', x: 221, y: 65, w: 40, h: 60 },
      { asset: 'prop_dishes', x: 150, y: 49, w: 28, h: 16 },
      { asset: 'prop_pot', x: 186, y: 54, w: 20, h: 14, effect: 'warn' },
    ],
    assumption: '큰 냄비·프라이팬을 자주 쓰는 경우',
    needsCheck: '넣을 수 있는 식기 크기와 사용 가능 소재는 설명서로 확인해야 해요.',
  },
  {
    id: 'dw_maintenance',
    title: '사용 후 관리',
    caption: '필터를 꺼내 청소하는 관리 작업을 살펴봐요.',
    background: 'bg_kitchen',
    layers: [
      { asset: 'dw_open', x: 221, y: 65, w: 40, h: 60 },
      { asset: 'dw_filter', x: 191, y: 142, w: 12, h: 10, effect: 'check' },
    ],
    assumption: '주기적으로 필터를 청소하는 경우',
    needsCheck: '필터 관리 방식과 주기는 해당 모델 설명서로 확인해야 해요.',
  },
]

const DRYER: Scene[] = [
  {
    id: 'dr_cycle',
    title: '세탁물 건조',
    caption: '세탁이 끝난 빨래를 건조기로 말리는 과정을 살펴봐요.',
    background: 'bg_laundry',
    layers: [
      { asset: 'dr_closed', x: 178, y: 65, w: 44, h: 52 },
      { asset: 'dr_drum', x: 190, y: 85, w: 20, h: 20, effect: 'spin' },
      { asset: 'prop_basket', x: 133, y: 141, w: 24, h: 18 },
    ],
    assumption: '세탁 후 바로 건조기로 옮기는 경우',
    needsCheck: '건조 시간과 한 번에 말릴 수 있는 양은 제품 자료로 확인해야 해요.',
  },
  {
    id: 'dr_constraint',
    title: '의류·용량 제약',
    caption: '건조기에 넣기 어려운 옷이 섞여 있는 경우를 살펴봐요.',
    background: 'bg_laundry',
    layers: [
      { asset: 'dr_open', x: 170, y: 65, w: 52, h: 52 },
      { asset: 'prop_basket', x: 133, y: 141, w: 24, h: 18 },
      { asset: 'prop_clothes', x: 152, y: 153, w: 24, h: 12 },
      { asset: 'prop_knit', x: 134, y: 128, w: 16, h: 12, effect: 'warn' },
    ],
    assumption: '니트처럼 건조에 주의가 필요한 옷이 섞여 있음',
    needsCheck: '건조 가능한 소재와 코스는 의류 라벨과 제품 설명서로 확인해야 해요.',
  },
  {
    id: 'dr_maintenance',
    title: '사용 후 관리',
    caption: '먼지 필터와 물통을 비우는 관리 작업을 살펴봐요.',
    background: 'bg_laundry',
    layers: [
      { asset: 'dr_open', x: 170, y: 65, w: 52, h: 52 },
      { asset: 'dr_filter', x: 157, y: 142, w: 14, h: 10, effect: 'check' },
      { asset: 'dr_watertank', x: 220, y: 142, w: 14, h: 10, effect: 'check' },
    ],
    assumption: '건조 후 매번 필터를 비우는 경우',
    needsCheck: '물통이 있는 방식인지, 배수 연결인지는 해당 모델 자료로 확인해야 해요.',
  },
]

const AIR_PURIFIER: Scene[] = [
  {
    id: 'ap_run',
    title: '공간에서 사용',
    caption: '거실에 두고 켜 둔 모습을 살펴봐요.',
    background: 'bg_living',
    layers: [AIR],
    assumption: '거실 한쪽에 두고 사용하는 경우',
    needsCheck: '사용 가능 면적은 제품 자료로 확인해야 해요. 정화나 건강 효과를 보여주는 장면이 아니에요.',
  },
  {
    id: 'ap_night',
    title: '배치·취침 조건',
    caption: '불을 끈 밤에 켜 두는 상황을 살펴봐요.',
    background: 'bg_living',
    tone: 'night',
    layers: [AIR],
    assumption: '잠자는 동안 켜 두는 경우',
    needsCheck: '취침 모드 소음과 표시등 밝기는 측정 조건이 있는 자료로 확인해야 해요.',
  },
  {
    id: 'ap_filter',
    title: '필터 관리',
    caption: '쓰던 필터를 새 필터로 바꾸는 관리 작업을 살펴봐요.',
    background: 'bg_living',
    layers: [
      { ...AIR, effect: undefined },
      { asset: 'ap_filter_used', x: 227, y: 141, w: 16, h: 20 },
      { asset: 'ap_filter', x: 250, y: 141, w: 16, h: 20, effect: 'check' },
    ],
    assumption: '필터를 정해진 주기로 교체하는 경우',
    needsCheck: '필터 교체 주기와 가격은 제조사 자료로 확인해야 해요. 그림의 색 변화는 예시예요.',
  },
]

export const SCENES: Record<Category, Scene[]> = {
  robot_vacuum: ROBOT_VACUUM,
  dishwasher: DISHWASHER,
  dryer: DRYER,
  air_purifier: AIR_PURIFIER,
}
