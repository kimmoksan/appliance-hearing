import { useEffect, useRef, useState } from 'react'
import type { Layer, Scene } from '../scenes'

const W = 320
const H = 180
const pct = (v: number, base: number) => `${(v / base) * 100}%`
const MS_PER_PX = 25

// 그림 파일이 없으면 같은 이름의 임시 상자를 보여준다. 파일을 넣으면 그대로 교체된다.
function Asset({ id, className }: { id: string; className?: string }) {
  const [missing, setMissing] = useState(false)
  if (missing) return <div className={`placeholder ${className ?? ''}`}>{id}</div>
  return <img className={className} src={`/assets/${id}.png`} alt="" onError={() => setMissing(true)} />
}

function LayerView({ layer, paused }: { layer: Layer; paused: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const anim = useRef<Animation | null>(null)

  useEffect(() => {
    if (!layer.path || !ref.current) return
    const pts = layer.path
    const dist = pts.slice(1).reduce((d, p, i) => d + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0)
    anim.current = ref.current.animate(
      pts.map(([x, y]) => ({ left: pct(x, W), top: pct(y, H) })),
      { duration: Math.max(dist * MS_PER_PX, 2000), iterations: Infinity },
    )
    return () => anim.current?.cancel()
  }, [layer.path])

  useEffect(() => {
    if (!anim.current) return
    if (paused) anim.current.pause()
    else anim.current.play()
  }, [paused])

  return (
    <div
      ref={ref}
      className={`layer ${layer.effect ? `fx-${layer.effect}` : ''}`}
      style={{ left: pct(layer.x, W), top: pct(layer.y, H), width: pct(layer.w, W), height: pct(layer.h, H) }}
    >
      <Asset id={layer.asset} />
    </div>
  )
}

export default function Stage({ scene, paused }: { scene: Scene; paused: boolean }) {
  return (
    <div className={`stage ${paused ? 'paused' : ''}`} role="img" aria-label={`${scene.title}: ${scene.caption}`}>
      <Asset key={scene.background} id={scene.background} className="bg" />
      {scene.layers.map((l, i) => (
        <LayerView key={`${scene.id}-${i}`} layer={l} paused={paused} />
      ))}
    </div>
  )
}
