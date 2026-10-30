import { useEffect, useState, type FormEvent } from 'react'
import { fetchCatalog, type FieldErrors } from '../api'
import HouseArt from '../components/HouseArt'
import Kkang from '../components/Kkang'
import { CATEGORIES, type CatalogProduct, type IntakeInput } from '../types'

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
  const [manual, setManual] = useState(!input.catalog_model && !!input.product_text)
  const [brand, setBrand] = useState('')
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [catalogError, setCatalogError] = useState(false)
  const [retry, setRetry] = useState(0)
  const shown = { ...errors, ...local }
  const selectedBrand = brand || products.find((p) => p.model === input.catalog_model)?.brand || ''
  const brands = [...new Set(products.map((p) => p.brand))]

  useEffect(() => {
    let alive = true
    fetchCatalog(input.category)
      .then((items) => { if (alive) setProducts(items) })
      .catch(() => { if (alive) { setCatalogError(true); setProducts([]) } })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [input.category, retry])

  function change(next: IntakeInput) {
    setLocal({})
    onChange(next)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const next: FieldErrors = {}
    if (manual && !input.product_text.trim()) next.product_text = '제품 링크나 제품 정보를 입력해 주세요.'
    if (!manual && (!input.catalog_model || !products.some((p) => p.model === input.catalog_model))) {
      next.catalog_model = '브랜드와 제품 모델을 선택해 주세요.'
    }
    if (!input.reason.trim()) next.reason = '구매 이유를 한 줄로 입력해 주세요.'
    setLocal(next)
    if (Object.keys(next).length === 0) onSubmit()
  }

  return (
    <section className="intro">
      <form className="intro-form" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">구매 전, 한 번 더.</p>
        <h1>내 생활에 맞는지,<br />먼저 살펴보세요.</h1>
        <p className="muted">살까 말까 고민될 때, 살깡이와 말깡이가 대신 다퉈 드려요</p>
        <div className="kkang-trio" aria-hidden="true">
          <Kkang pose="pro_wave" delay={0} />
          <Kkang pose="guide_greet" delay={0.6} />
          <Kkang pose="con_curious" delay={1.2} />
        </div>

        <fieldset className="chips" disabled={busy}>
          <legend>1. 제품군</legend>
          {CATEGORIES.map((c) => (
            <label key={c.id} className="chip">
              <input type="radio" name="category" value={c.id} checked={input.category === c.id}
                onChange={() => { setLoading(true); setCatalogError(false); setBrand(''); change({ ...input, category: c.id, catalog_model: undefined }) }} />
              {c.label}
            </label>
          ))}
        </fieldset>
        <p className="field-error">{shown.category}</p>

        {manual ? <>
        <label htmlFor="product_text">제품 링크 또는 제품 정보</label>
        <textarea
          id="product_text"
          rows={3}
          maxLength={5000}
          placeholder="모델명·사양을 붙여넣거나 제품 정보를 입력하세요"
          value={input.product_text}
          aria-invalid={!!shown.product_text}
          aria-describedby="product_text_err"
          onChange={(e) => change({ ...input, product_text: e.target.value, catalog_model: undefined })}
        />
        <p id="product_text_err" className="field-error">{shown.product_text}</p>
        </> : <>
          <label htmlFor="catalog_brand">2. 브랜드</label>
          <select id="catalog_brand" value={selectedBrand} disabled={busy || loading}
            onChange={(e) => { setBrand(e.target.value); change({ ...input, catalog_model: undefined }) }}>
            <option value="">브랜드를 선택해 주세요</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <label htmlFor="catalog_model">3. 제품 모델</label>
          <select id="catalog_model" value={input.catalog_model ?? ''} disabled={busy || loading || !selectedBrand}
            aria-invalid={!!shown.catalog_model} aria-describedby="catalog_model_err"
            onChange={(e) => change({ ...input, catalog_model: e.target.value || undefined })}>
            <option value="">제품 모델을 선택해 주세요</option>
            {products.filter((p) => p.brand === selectedBrand).map((p) => (
              <option key={p.model} value={p.model}>{p.name} · {p.model}{p.status === '단종' ? ' (단종)' : ''}</option>
            ))}
          </select>
          <p id="catalog_model_err" className="field-error">{shown.catalog_model}</p>
          {input.catalog_model && <p className="muted catalog-note">모델명: {input.catalog_model}</p>}
          {products.find((p) => p.model === input.catalog_model)?.status === '단종' && <p className="catalog-note"><span className="tag outline">단종</span> 판매·지원 여부를 별도로 확인해 주세요.</p>}
          {loading && <p className="muted catalog-note" role="status">제품 목록을 불러오는 중이에요…</p>}
          {!loading && (catalogError || products.length === 0) && <div className="catalog-note" role="status">
            <p>{catalogError ? '제품 목록을 불러오지 못했어요.' : '등록된 제품이 없어요.'} 링크나 제품 정보로 시작할 수 있어요.</p>
            <button type="button" className="link" onClick={() => { setLoading(true); setCatalogError(false); setRetry(retry + 1) }}>목록 다시 불러오기</button>
          </div>}
        </>}
        <button type="button" className="link catalog-mode" disabled={busy} onClick={() => {
          setManual(!manual)
          change({ ...input, catalog_model: undefined })
        }}>{manual ? '카탈로그에서 고르기' : '목록에 없어요 · 직접 입력하기'}</button>

        <label htmlFor="reason">구매 이유</label>
        <input
          id="reason"
          maxLength={200}
          placeholder="예: 퇴근 후 청소 부담을 줄이고 싶어요"
          value={input.reason}
          aria-invalid={!!shown.reason}
          aria-describedby="reason_err"
          onChange={(e) => change({ ...input, reason: e.target.value })}
        />
        <p id="reason_err" className="field-error">{shown.reason}</p>

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
