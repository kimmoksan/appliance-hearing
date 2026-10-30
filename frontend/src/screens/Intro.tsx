import { useState, type FormEvent } from 'react'
import type { FieldErrors } from '../api'
import HouseArt from '../components/HouseArt'
import { CATEGORIES, type IntakeInput } from '../types'

type Props = {
  input: IntakeInput
  onChange: (input: IntakeInput) => void
  onSubmit: () => void
  onExample: () => void
  busy: boolean
  errors: FieldErrors
  message: string | null
}

const STEPS = [
  ['제품 확인', '제품 정보를 확인해요'],
  ['상황과 근거', '내 생활과 맞는지 살펴봐요'],
  ['나의 결정', '스스로 판단할 수 있어요'],
]

export default function Intro({ input, onChange, onSubmit, onExample, busy, errors, message }: Props) {
  const [local, setLocal] = useState<FieldErrors>({})
  const shown = { ...errors, ...local }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: FieldErrors = {}
    if (!input.product_text.trim()) next.product_text = '제품 링크나 제품 정보를 입력해 주세요.'
    if (!input.reason.trim()) next.reason = '구매 이유를 한 줄로 입력해 주세요.'
    setLocal(next)
    if (Object.keys(next).length === 0) onSubmit()
  }

  return (
    <section className="intro">
      <form className="intro-form" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">구매 전, 한 번 더.</p>
        <h1>내 생활에 맞는지,<br />먼저 살펴보세요.</h1>
        <p className="muted">제품 정보와 구매 이유만으로 시작하는 가전 구매 청문회</p>

        <label htmlFor="product_text">제품 링크 또는 제품 정보</label>
        <textarea
          id="product_text"
          rows={3}
          maxLength={5000}
          placeholder="모델명·사양을 붙여넣거나 제품 정보를 입력하세요"
          value={input.product_text}
          aria-invalid={!!shown.product_text}
          aria-describedby="product_text_err"
          onChange={(e) => onChange({ ...input, product_text: e.target.value })}
        />
        <p id="product_text_err" className="field-error">{shown.product_text}</p>

        <label htmlFor="reason">구매 이유</label>
        <input
          id="reason"
          maxLength={200}
          placeholder="예: 퇴근 후 청소 부담을 줄이고 싶어요"
          value={input.reason}
          aria-invalid={!!shown.reason}
          aria-describedby="reason_err"
          onChange={(e) => onChange({ ...input, reason: e.target.value })}
        />
        <p id="reason_err" className="field-error">{shown.reason}</p>

        <fieldset className="chips">
          <legend>지원하는 가전제품</legend>
          {CATEGORIES.map((c) => (
            <label key={c.id} className="chip">
              <input
                type="radio"
                name="category"
                value={c.id}
                checked={input.category === c.id}
                onChange={() => onChange({ ...input, category: c.id })}
              />
              {c.label}
            </label>
          ))}
        </fieldset>
        <p className="field-error">{shown.category}</p>

        {message && <p className="form-error" role="alert">{message}</p>}

        <div className="actions">
          <button type="submit" className="primary" disabled={busy}>
            {busy ? '확인 중…' : '사용 장면 살펴보기 →'}
          </button>
          <button type="button" className="secondary" onClick={onExample} disabled={busy}>
            예시로 먼저 체험하기
          </button>
        </div>
      </form>

      <div className="intro-art">
        <HouseArt />
      </div>

      <ol id="how" className="steps">
        {STEPS.map(([title, desc]) => (
          <li key={title}>
            <strong>{title}</strong>
            <span className="muted">{desc}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
