import { useEffect, useState } from 'react'
import { ApiError, fetchExample, submitIntake, type FieldErrors } from './api'
import Intro from './screens/Intro'
import type { IntakeInput, Product } from './types'

type Health = { status: string; mode: 'mock' | 'live' }

const MODE_LABEL = { mock: '예시 모드 · 실제 AI 응답 아님', live: '실제 AI 모드' }
const EMPTY: IntakeInput = { category: 'robot_vacuum', product_text: '', reason: '' }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [input, setInput] = useState<IntakeInput>(EMPTY)
  const [product, setProduct] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setHealth)
      .catch(() => setHealth(null))
  }, [])

  // 실패해도 input은 그대로 둔다(입력 보존).
  async function run(call: () => Promise<Product>) {
    setBusy(true)
    setErrors({})
    setMessage(null)
    try {
      setProduct(await call())
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError('알 수 없는 오류가 났어요. 다시 시도해 주세요.')
      setErrors(err.fields)
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  function restart() {
    setInput(EMPTY)
    setProduct(null)
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
        {product ? (
          // shortcut: 2단계 임시 결과 표시. 3단계에서 제품 확인 화면으로 교체.
          <section className="temp-result">
            <h2>서버 응답 확인 (임시)</h2>
            <p>{product.is_example ? '예시 제품' : '입력한 제품'}: <strong>{product.name}</strong></p>
            <p>구매 이유: {product.reason}</p>
            {product.notices.map((n) => <p key={n} className="notice">{n}</p>)}
            <button type="button" className="secondary" onClick={() => setProduct(null)}>← 입력으로 돌아가기</button>
          </section>
        ) : (
          <Intro
            input={input}
            onChange={setInput}
            onSubmit={() => run(() => submitIntake(input))}
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
