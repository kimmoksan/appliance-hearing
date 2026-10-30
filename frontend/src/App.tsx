import { useEffect, useState } from 'react'

type Health = { status: string; mode: 'mock' | 'live' }

const MODE_LABEL = { mock: '예시 모드 · 실제 AI 응답 아님', live: '실제 AI 모드' }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setHealth)
      .catch(() => setError(true))
  }, [])

  return (
    <main>
      <h1>BEFORE <span className="muted">(가칭)</span></h1>
      <p>제품 정보와 구매 이유로 시작하는 가전 구매 청문회</p>
      <p role="status">
        {health && <span className="badge">{MODE_LABEL[health.mode]}</span>}
        {error && <span className="muted">API 서버에 연결하지 못했어요. 백엔드를 실행했는지 확인하세요.</span>}
        {!health && !error && <span className="muted">서버 확인 중…</span>}
      </p>
    </main>
  )
}
