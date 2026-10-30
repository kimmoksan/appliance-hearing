// 도트 로고: 보라 말풍선(살깡이)과 주황 말풍선(말깡이)이 마주 본다. 12×10 픽셀 격자.
const PRO = ['0110000', '1111100', '1111100', '1111100', '0111000', '0100000']
const CON = ['0000110', '0011111', '0011111', '0011111', '0001110', '0000010']

function Pixels({ rows, x, y, color }: { rows: string[]; x: number; y: number; color: string }) {
  return rows.flatMap((row, r) =>
    [...row].map((c, i) => (c === '1' ? <rect key={`${r}-${i}`} x={x + i} y={y + r} width="1" height="1" fill={color} /> : null)),
  )
}

export default function LogoMark() {
  return (
    <svg className="logo-mark" viewBox="0 0 12 10" shapeRendering="crispEdges" aria-hidden="true">
      <Pixels rows={PRO} x={0} y={0} color="var(--accent)" />
      <Pixels rows={CON} x={5} y={4} color="var(--con)" />
    </svg>
  )
}
