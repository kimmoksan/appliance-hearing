import { useState } from 'react'
import type { FieldErrors } from '../api'
import { CATEGORIES, type Product, type Source } from '../types'

type Props = {
  product: Product
  busy: boolean
  errors: FieldErrors
  message: string | null
  onBack: () => void
  onStart: () => void
  onUpdateReason: (reason: string) => void
  onAddInfo: (text: string) => void
}

const SOURCE_LABEL = { user_input: '입력한 자료', example: '예시 자료', link: '링크 자료', catalog: '제조사 공식' }

function sourceNote(s: Source) {
  if (s.kind === 'catalog') return `제조사 공식 · 확인일 ${s.checked_at ?? '확인 필요'}`
  const at = new Date(s.received_at).toLocaleString('ko-KR')
  if (s.kind === 'example') return '서비스가 준비한 예시 자료예요. 실제 제품 정보가 아니에요.'
  if (s.kind === 'link') return `입력한 링크에서 읽은 페이지 내용 · ${at}`
  return `사용자가 직접 입력한 내용 · ${at} 입력`
}

export function Stepper({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="stepper" aria-label="진행 단계">
      {['제품 확인', '상황 살펴보기', '나의 결정'].map((label, i) => (
        <li key={label} aria-current={i + 1 === current ? 'step' : undefined}>
          <span className="dot">{i + 1}</span>
          {label}
        </li>
      ))}
    </ol>
  )
}

export default function ProductCheck({ product, busy, errors, message, onBack, onStart, onUpdateReason, onAddInfo }: Props) {
  const [editing, setEditing] = useState(false)
  const [reason, setReason] = useState(product.reason)
  const [extra, setExtra] = useState('')
  const [openRaw, setOpenRaw] = useState<string | null>(null)
  const sourceTag = (id: string | null) => {
    const kind = product.sources.find((x) => x.id === id)?.kind
    return kind ? SOURCE_LABEL[kind] : '자료 없음'
  }
  const category = CATEGORIES.find((c) => c.id === product.category)?.label

  return (
    <section className="check">
      <div className="check-head">
        <div>
          <p className="muted crumb">제품 입력 / <strong>정보 확인</strong></p>
          <h1>이 제품이 맞나요?</h1>
          <p className="muted">확인된 정보만으로 사용 장면을 구성해요.</p>
        </div>
        <Stepper current={1} />
      </div>

      {product.notices.map((n) => <p key={n} className="notice" role="status">{n}</p>)}

      <div className="check-grid">
        <article className="card">
          <p className="tags">
            {product.is_example && <span className="tag">예시 제품</span>}
            <span className="tag outline">{category}</span>
          </p>
          <h2>{product.name}</h2>
          <h3>구매를 고려하는 이유</h3>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                // 성공하면 새 제품으로 화면이 다시 그려진다. 실패하면 편집 내용 유지.
                onUpdateReason(reason)
              }}
            >
              <label htmlFor="edit_reason" className="sr-only">구매 이유</label>
              <input id="edit_reason" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="row">
                <button type="submit" className="primary small" disabled={busy || !reason.trim()}>저장</button>
                <button type="button" className="secondary small" onClick={() => { setReason(product.reason); setEditing(false) }}>취소</button>
              </div>
            </form>
          ) : (
            <p className="quote">
              {product.reason}
              {!product.is_example && (
                <button type="button" className="link small" onClick={() => setEditing(true)}>수정</button>
              )}
            </p>
          )}
          {errors.reason && <p className="field-error">{errors.reason}</p>}
        </article>

        <article className="card">
          <div className="row between">
            <h2>제품 주요 정보</h2>
            <span className="muted small">정보가 없는 항목은 추측하지 않아요.</span>
          </div>
          <table className="specs">
            <tbody>
              {product.specs.map((s) => (
                <tr key={s.key}>
                  <th scope="row">{s.label}</th>
                  <td>{s.status === 'needs_check' ? <span className="muted">{s.value || '확인 필요'}</span> : s.value}</td>
                  <td><span className="tag outline small">{s.status === 'needs_check' ? '확인 필요' : sourceTag(s.source_id) === '제조사 공식' ? '제조사 확인' : sourceTag(s.source_id)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>

          {product.sources.length === 0 && <p className="muted small">확보한 자료가 없어요.</p>}
          {product.sources.map((s) => (
            <div className="source" key={s.id}>
              <div className="row between">
                <div>
                  <strong>{SOURCE_LABEL[s.kind]}</strong>
                  <p className="muted small">{sourceNote(s)}</p>
                  {s.url && (
                    <a className="small url" href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a>
                  )}
                </div>
                <button
                  type="button"
                  className="link"
                  aria-expanded={openRaw === s.id}
                  onClick={() => setOpenRaw(openRaw === s.id ? null : s.id)}
                >
                  {openRaw === s.id ? '원문 닫기' : '원문 보기'}
                </button>
              </div>
              {openRaw === s.id && <pre className="raw">{s.text}</pre>}
            </div>
          ))}
        </article>
      </div>

      {product.is_example ? (
        <p className="muted">예시 제품은 수정할 수 없어요. 내 제품으로 해 보려면 돌아가서 직접 입력하세요.</p>
      ) : (
        <details className="card add-info" open={product.sources.length === 0}>
          <summary><strong>제품 정보 붙여넣기</strong> <span className="muted small">(선택)</span></summary>
          <label htmlFor="extra" className="sr-only">제품 정보 붙여넣기</label>
          <textarea
            id="extra"
            rows={3}
            maxLength={5000}
            placeholder="링크로 부족하면 공식 홈페이지·상세 페이지의 모델명, 주요 사양, 구성품, 크기 등을 붙여넣어 주세요."
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
          {errors.product_text && <p className="field-error">{errors.product_text}</p>}
          <button type="button" className="secondary small" disabled={busy || !extra.trim()} onClick={() => onAddInfo(extra)}>
            자료 추가
          </button>
        </details>
      )}

      {message && <p className="form-error" role="alert">{message}</p>}

      <div className="row between nav-row">
        <button type="button" className="link" onClick={onBack}>← 돌아가기</button>
        <button type="button" className="primary" onClick={onStart} disabled={busy}>이 정보로 시작하기 →</button>
      </div>
    </section>
  )
}
