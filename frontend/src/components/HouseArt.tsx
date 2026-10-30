// 인트로 집 단면 그림 + 조명·창밖 불빛 효과. 좌표는 intro_house.png(520×335) 픽셀 기준.
const TOP = 73 // 그림의 투명 여백을 잘라낸 위쪽 시작
const H = 188 // 실제 그림 높이 (73~261)
const at = (x: number, y: number) => ({ left: `${(x / 520) * 100}%`, top: `${((y - TOP) / H) * 100}%` })

// [x, y, 빛 크기(px 기준), 아래로 퍼지는 빛 여부]
const LAMPS: [number, number, number, boolean][] = [
  [136, 124, 60, true], // 거실 펜던트
  [242, 153, 34, false], // 탁상 스탠드
  [288, 150, 50, false], // 플로어 스탠드
  [361, 127, 56, true], // 주방 펜던트
  [478, 116, 40, false], // 세탁실 천장등
]
const WINDOWS: [number, number][] = [
  [181, 124], [177, 130], [209, 130], [164, 135], [149, 136],
  [213, 136], [151, 142], [194, 142], [222, 142], [206, 149],
]

export default function HouseArt() {
  return (
    <div className="house" aria-hidden="true">
      <div className="house-track">
        <img src="/assets/intro_house.png" alt="" />
        {WINDOWS.map(([x, y], i) => (
          <span key={`w${i}`} className="window-off" style={{ ...at(x, y), animationDelay: `${(i * 1.7) % 9}s` }} />
        ))}
        {LAMPS.map(([x, y, size, cone], i) => (
          <span key={`l${i}`}>
            {cone && <span className="lamp-cone" style={{ ...at(x, y), width: `${(size / 520) * 100}%`, animationDelay: `${i * 0.7}s` }} />}
            <span className="lamp-glow" style={{ ...at(x, y), width: `${((size * 1.6) / 520) * 100}%`, animationDelay: `${i * 0.7}s` }} />
          </span>
        ))}
      </div>
    </div>
  )
}
