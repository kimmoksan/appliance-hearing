import { useState } from 'react'
import Stage from '../components/Stage'
import { SCENES } from '../scenes'
import { CATEGORIES, type Product } from '../types'

type Props = { product: Product; onBack: () => void; onHearing: (sceneId: string) => void }

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export default function Scenes({ product, onBack, onHearing }: Props) {
  const scenes = SCENES[product.category]
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(prefersReducedMotion)
  const category = CATEGORIES.find((c) => c.id === product.category)?.label

  if (!scenes) {
    return (
      <section className="check">
        <h1>{category} 장면은 준비 중이에요</h1>
        <p className="muted">도트 장면은 로봇청소기부터 만들고 있어요. 다른 제품군은 그림이 준비되면 추가돼요.</p>
        <button type="button" className="link" onClick={onBack}>← 제품 확인으로 돌아가기</button>
      </section>
    )
  }

  const scene = scenes[index]
  return (
    <section className="scenes">
      <div className="scenes-head">
        <p className="tags">
          <span className="tag outline">상황 {index + 1} / {scenes.length}</span>
          <span className="tag outline">조건부 예시</span>
          <span className="tag outline">예시 장면 · AI 구성 아님</span>
        </p>
        <h1>{scene.title}</h1>
      </div>

      <div className="scenes-grid">
        <div className="player">
          <Stage scene={scene} paused={paused} />
          <div className="player-bar">
            <button type="button" className="secondary small" aria-pressed={paused} onClick={() => setPaused(!paused)}>
              {paused ? '움직임 다시 보기' : '움직임 멈추기'}
            </button>
            <p className="caption">{scene.caption}</p>
          </div>
          <ol className="scene-steps">
            {scenes.map((s, i) => (
              <li key={s.id}>
                <button type="button" aria-current={i === index ? 'step' : undefined} onClick={() => setIndex(i)}>
                  <span className="dot">{i + 1}</span>
                  {s.title}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <aside className="card conditions">
          <h2>이번 장면의 조건</h2>
          <div className="cond">
            <span className="tag">사용자 입력</span>
            <p>“{product.reason}”</p>
          </div>
          <div className="cond">
            <span className="tag">가정</span>
            <p>{scene.assumption}</p>
          </div>
          <div className="cond">
            <span className="tag">확인 필요</span>
            <p>{scene.needsCheck}</p>
          </div>
          <p className="muted small">ⓘ 제품 성능을 재현한 영상이 아닌 가상 상황이에요. 실제 집 구조·축척과 달라요.</p>
        </aside>
      </div>

      <div className="row between nav-row">
        <button type="button" className="link" onClick={onBack}>← 제품 확인</button>
        <div className="row">
          {index < scenes.length - 1 && (
            <button type="button" className="secondary" onClick={() => setIndex(index + 1)}>다음 상황 건너뛰기</button>
          )}
          <button type="button" className="primary" onClick={() => onHearing(scene.id)}>이 상황의 찬반 듣기 →</button>
        </div>
      </div>
    </section>
  )
}
