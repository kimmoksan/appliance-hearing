import { useCallback, useEffect, useState } from 'react'
import { ApiError, fetchExample, submitIntake, type FieldErrors } from './api'
import Intro from './screens/Intro'
import ProductCheck from './screens/ProductCheck'
import Scenes from './screens/Scenes'
import DecisionSummary from './screens/DecisionSummary'
import LogoMark from './components/LogoMark'
import type { DecisionDraft, Hearing, IntakeInput, Product } from './types'

type Health = { status: string; mode: 'mock' | 'live' }

const MODE_LABEL = { mock: '예시 모드 · 실제 AI 응답 아님', live: '실제 AI 모드' }
const EMPTY: IntakeInput = { category: 'robot_vacuum', product_text: '', reason: '' }
const EMPTY_DECISION: DecisionDraft = { choice: null, reason: '' }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [input, setInput] = useState<IntakeInput>(EMPTY)
  const [product, setProduct] = useState<Product | null>(null)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [hearings, setHearings] = useState<Record<string, Hearing>>({})
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sceneIndex, setSceneIndex] = useState(0)
  const [decision, setDecision] = useState<DecisionDraft>(EMPTY_DECISION)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)
  const recordHearing = useCallback((hearing: Hearing) => {
    setHearings((previous) => ({ ...previous, [hearing.scene_id]: hearing }))
  }, [])

  function clearReview() {
    setStarted(false)
    setFinished(false)
    setHearings({})
    setAnswers({})
    setSceneIndex(0)
    setDecision(EMPTY_DECISION)
  }

  function answerScene(id: string, answer: string) {
    if (answers[id] === answer) return
    // 직전 공방은 지우지 않는다: 실제 모드는 이걸 보내야 답을 반영할 수 있고, 새 공방이 오면 덮어쓴다.
    setAnswers((previous) => ({ ...previous, [id]: answer }))
    // 판단 근거가 달라지면 이전 결정을 자동으로 이어받지 않는다.
    setDecision(EMPTY_DECISION)
  }

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setHealth)
      .catch(() => setHealth(null))
  }, [])

  // 실패해도 input은 그대로 둔다(입력 보존). 성공했을 때만 onSuccess로 반영.
  async function run(call: () => Promise<Product>, onSuccess?: () => void) {
    setBusy(true)
    setErrors({})
    setMessage(null)
    try {
      setProduct(await call())
      clearReview()
      onSuccess?.()
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('알 수 없는 오류가 났어요. 다시 시도해 주세요.')
      setErrors(err.fields)
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  function submit(next: IntakeInput) {
    run(() => submitIntake(next), () => setInput(next))
  }

  function restart() {
    setInput(EMPTY)
    setProduct(null)
    clearReview()
    setErrors({})
    setMessage(null)
  }

  return (
    <>
      <header className="site-header">
        <button type="button" className="logo" onClick={restart} aria-label="살깡말깡 처음으로">
          <LogoMark />
          <span><span className="logo-pro">살깡</span><span className="logo-con">말깡</span></span>
        </button>
        <nav>
          <a href="#how">이용 방법</a>
          <button type="button" className="link" onClick={() => run(fetchExample)}>예시 체험</button>
        </nav>
        {health && <span className="badge">{MODE_LABEL[health.mode]}</span>}
      </header>
      <main>
        {product && started ? (
          <>
            <div hidden={finished}>
              <Scenes product={product} hearings={hearings} answers={answers} index={sceneIndex}
                onIndexChange={setSceneIndex} onHearing={recordHearing} onAnswer={answerScene} active={!finished}
                onBack={() => setStarted(false)} onFinish={() => setFinished(true)} />
            </div>
            {finished && <DecisionSummary product={product} hearings={hearings} draft={decision}
              onChange={setDecision} onRestart={restart}
              onReview={(index) => { setSceneIndex(index); setFinished(false) }} />}
          </>
        ) : product ? (
          <ProductCheck
            key={(input.catalog_model ?? '') + input.product_text + product.reason}
            product={product}
            busy={busy}
            errors={errors}
            message={message}
            onBack={() => { setProduct(null); setErrors({}); setMessage(null) }}
            onStart={() => setStarted(true)}
            onUpdateReason={(reason) => submit({ ...input, reason })}
            onAddInfo={(text) =>
              submit({ ...input, product_text: `${input.product_text}\n\n${text}` })
            }
          />
        ) : (
          <Intro
            input={input}
            onChange={setInput}
            onSubmit={() => submit(input)}
            onExample={() => run(fetchExample)}
            busy={busy}
            errors={errors}
            message={message}
          />
        )}
      </main>
    </>
  )
}
