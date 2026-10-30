import { useEffect, useState } from 'react'
import { ApiError, fetchExample, submitIntake, type FieldErrors } from './api'
import Intro from './screens/Intro'
import ProductCheck from './screens/ProductCheck'
import Scenes from './screens/Scenes'
import type { IntakeInput, Product } from './types'

type Health = { status: string; mode: 'mock' | 'live' }

const MODE_LABEL = { mock: '예시 모드 · 실제 AI 응답 아님', live: '실제 AI 모드' }
const EMPTY: IntakeInput = { category: 'robot_vacuum', product_text: '', reason: '' }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [input, setInput] = useState<IntakeInput>(EMPTY)
  const [product, setProduct] = useState<Product | null>(null)
  const [started, setStarted] = useState(false)
  const [hearing, setHearing] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)

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
    setStarted(false)
    setHearing(null)
    setErrors({})
    setMessage(null)
  }

  return (
    <>
      <header className="site-header">
        <button type="button" className="logo" onClick={restart}>BEFORE</button>
        <nav>
          <a href="#how">이용 방법</a>
          <button type="button" className="link" onClick={() => run(fetchExample)}>예시 체험</button>
        </nav>
        {health && <span className="badge">{MODE_LABEL[health.mode]}</span>}
      </header>
      <main>
        {product && started && hearing ? (
          // shortcut: 청문회 화면은 feature/hearing에서. 그 전까지 자리표시.
          <section className="check">
            <h1>청문회는 준비 중이에요</h1>
            <p className="muted">선택한 상황({hearing})의 찬반 공방은 다음 단계에서 만들어요.</p>
            <button type="button" className="link" onClick={() => setHearing(null)}>← 상황으로 돌아가기</button>
          </section>
        ) : product && started ? (
          <Scenes product={product} onBack={() => setStarted(false)} onHearing={setHearing} />
        ) : product ? (
          <ProductCheck
            key={input.product_text + product.reason}
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
