import { useEffect, useState } from 'react'
import Stage from '../components/Stage'
import HearingPanel from './HearingPanel'
import { SCENES } from '../scenes'
import type { Hearing, Product } from '../types'

type Props = {
  product: Product; onBack: () => void; onFinish: () => void
  hearings: Record<string, Hearing>; answers: Record<string, string>
  onHearing: (hearing: Hearing) => void; onAnswer: (id: string, answer: string) => void
  index: number; onIndexChange: (index: number) => void; active: boolean
}

const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

export default function Scenes({ product, onBack, onFinish, hearings, answers, onHearing, onAnswer, index, onIndexChange, active }: Props) {
  const scenes = SCENES[product.category]
  const [paused, setPaused] = useState(prefersReducedMotion)
  // '움직임 멈추기'는 장면뿐 아니라 깡이 들썩임·배경 흔들림까지 멈춘다(계속 움직이는 요소는 사용자가 멈출 수 있어야 함).
  useEffect(() => {
    document.documentElement.toggleAttribute('data-still', paused)
    return () => document.documentElement.removeAttribute('data-still')
  }, [paused])
  const [view, setView] = useState<'scene' | 'hearing'>('scene')
  const setIndex = onIndexChange

  const scene = scenes[index]
  return (
    <section className="scenes">
      <div className="scenes-head">
        <p className="tags">
          <span className="tag outline">상황 {index + 1} / {scenes.length}</span>
          <span className="tag outline">조건부 예시</span>
          <span className="tag outline">예시 장면 · AI 구성 아님</span>
        </p>
        <div className="row between">
          <h1>{scene.title}</h1>
          <div className="toggle" role="group" aria-label="보기 전환">
            <button type="button" aria-pressed={view === 'scene'} onClick={() => setView('scene')}>상황</button>
            <button type="button" aria-pressed={view === 'hearing'} onClick={() => setView('hearing')}>청문회</button>
          </div>
        </div>
      </div>

      {view === 'hearing' ? (
        <HearingPanel
          key={scene.id}
          product={product}
          sceneId={scene.id}
          answer={answers[scene.id] ?? null}
          cached={hearings[scene.id]}
          onLoaded={onHearing}
          onAnswer={(a) => onAnswer(scene.id, a)}
          top={<Stage scene={scene} paused={paused || !active} />}
        />
      ) : (

      <div className="scenes-grid">
        <div className="player">
          <Stage scene={scene} paused={paused || !active} />
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
      )}

      <div className="row between nav-row">
        {view === 'hearing' ? (
          <button type="button" className="link" onClick={() => setView('scene')}>← 상황 다시 보기</button>
        ) : (
          <button type="button" className="link" onClick={onBack}>← 제품 확인</button>
        )}
        <div className="row">
          {view === 'scene' && index < scenes.length - 1 && (
            <button type="button" className="secondary" onClick={() => setIndex(index + 1)}>다음 상황 건너뛰기</button>
          )}
          {view === 'scene' ? (
            <button type="button" className="primary" onClick={() => setView('hearing')}>이 상황의 찬반 듣기 →</button>
          ) : index < scenes.length - 1 ? (
            <button type="button" className="primary" onClick={() => { setIndex(index + 1); setView('scene') }}>다음 상황 →</button>
          ) : (
            <button type="button" className="primary" onClick={onFinish}>결과 보기 →</button>
          )}
        </div>
      </div>
    </section>
  )
}
