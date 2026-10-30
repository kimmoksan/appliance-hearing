import type { Category } from './types'

// 좌표·크기는 기준 화면 320×180 px 단위 (docs/ASSETS.md).
export type Layer = {
  asset: string
  x: number
  y: number
  w: number
  h: number
  path?: [number, number][] // 순서대로 이동 후 반복
  effect?: 'blink' | 'warn' | 'check'
}

export type Scene = {
  id: string
  title: string
  caption: string
  background: string
  layers: Layer[]
  assumption: string
  needsCheck: string
}

const FLOOR_PATH: [number, number][] = [[230, 150], [140, 156], [60, 150], [140, 160], [230, 150]]

const ROBOT_VACUUM: Scene[] = [
  {
    id: 'rv_daily',
    title: '일상 청소',
    caption: '청소기가 정해진 경로로 바닥을 도는 모습을 살펴봐요.',
    background: 'bg_living',
    layers: [
      { asset: 'rv_dock', x: 270, y: 124, w: 24, h: 28 },
      { asset: 'rv_body', x: 230, y: 150, w: 28, h: 12, path: FLOOR_PATH, effect: 'blink' },
    ],
    assumption: '바닥에 걸리는 물건이 없는 경우',
    needsCheck: '실제 청소 범위와 걸리는 시간은 제품 자료로 확인해야 해요.',
  },
  {
    id: 'rv_clutter',
    title: '바닥 정리 부담',
    caption: '바닥에 작은 물건이 놓여 있는 경우를 살펴봐요.',
    background: 'bg_living',
    layers: [
      { asset: 'rv_dock', x: 270, y: 124, w: 24, h: 28 },
      { asset: 'prop_cable', x: 120, y: 160, w: 24, h: 8 },
      { asset: 'prop_socks', x: 180, y: 156, w: 12, h: 8 },
      { asset: 'prop_book', x: 80, y: 164, w: 14, h: 6 },
      { asset: 'prop_toy', x: 60, y: 150, w: 8, h: 8 },
      // 물건 앞에서 멈췄다가 돌아가는 것까지만. 실제 회피 성능을 표현하지 않는다.
      { asset: 'rv_body', x: 230, y: 152, w: 28, h: 12, path: [[230, 152], [150, 152], [150, 152], [230, 152]], effect: 'warn' },
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
      { asset: 'rv_dock', x: 270, y: 124, w: 24, h: 28 },
      { asset: 'rv_body', x: 268, y: 150, w: 28, h: 12 },
      { asset: 'rv_dustbin', x: 236, y: 156, w: 12, h: 10, effect: 'check' },
      { asset: 'rv_brush', x: 214, y: 160, w: 14, h: 6, effect: 'check' },
    ],
    assumption: '주기적으로 먼지통을 비우고 브러시를 청소하는 경우',
    needsCheck: '자동 비움 여부와 관리 주기는 설명서로 확인해야 해요.',
  },
]

// shortcut: 로봇청소기만 장면이 있음. 나머지 제품군은 자산이 오면 docs/ASSETS.md §4대로 추가.
export const SCENES: Partial<Record<Category, Scene[]>> = { robot_vacuum: ROBOT_VACUUM }
