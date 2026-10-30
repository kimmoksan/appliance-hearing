import { useState } from 'react'
import { DECISIONS, EVIDENCE_LABEL, decisionText, summarize, type SummaryClaim } from '../decision'
import { SCENES } from '../scenes'
import type { DecisionDraft, Hearing, Product } from '../types'
import { Stepper } from './ProductCheck'

type Props = {
  product: Product; hearings: Record<string, Hearing>; draft: DecisionDraft
  onChange: (draft: DecisionDraft) => void; onReview: (index: number) => void; onRestart: () => void
}

function ClaimList({ items }: { items: SummaryClaim[] }) {
  return items.length ? <ul className="summary-items">{items.map(({ id, sceneTitle, claim, evidence }) => (
    <li key={id}>
      <p className="muted small">{sceneTitle}{claim.status === 'revised' ? ' · 수정된 주장' : ''}</p>
      <p>{claim.text}</p>
      {claim.change_reason && <p className="muted small">변경 이유: {claim.change_reason}</p>}
      <details>
        <summary>근거 {evidence.length}개 보기</summary>
        <ul className="evidence-list">{evidence.map((e) => <li key={e.id}>
          <span className="tag outline small">{EVIDENCE_LABEL[e.kind]}</span><p>{e.text}</p>
        </li>)}</ul>
      </details>
    </li>
  ))}</ul> : <p className="muted">확인한 공방에 해당 내용이 없어요.</p>
}

export default function DecisionSummary({ product, hearings, draft, onChange, onReview, onRestart }: Props) {
  const summary = summarize(product, SCENES[product.category], hearings)
  const text = decisionText(product, summary, draft)
  const [copy, setCopy] = useState<{ text: string; status: 'success' | 'manual' } | null>(null)
  async function copyDecision() {
    try {
      await navigator.clipboard.writeText(text)
      setCopy({ text, status: 'success' })
    } catch {
      setCopy({ text, status: 'manual' })
    }
  }

  return <section className="check decision-summary">
    <div className="check-head">
      <div><p className="eyebrow">예시 공방 정리 · 실제 AI 응답 아님</p><h1>내 결정 정리</h1>
        <p className="muted">공방의 주장과 확인할 사항을 모았어요. 선택은 내가 해요.</p></div>
      <Stepper current={3} />
    </div>
    <article className="card">
      <h2>{product.name}</h2><p>구매 이유: {product.reason}</p>
      <p className="muted small">확인한 공방 {summary.completed} / {summary.total} · 가정과 미확인을 제품의 확정된 사실로 해석하지 마세요.</p>
      {summary.completed < summary.total && <p className="notice" role="status">아직 확인하지 않은 장면이 있어요. 아래 ‘확인 필요’에서 돌아볼 수 있어요.</p>}
    </article>
    {summary.answers.length > 0 && <section className="card"><h2>내 답변</h2><ul className="summary-items">{summary.answers.map((a) => (
      <li key={a.id}><p className="muted small">{a.sceneTitle}</p><p>{a.question}</p><strong>{a.answer}</strong></li>
    ))}</ul></section>}
    <div className="summary-grid">
      <article className="card"><h2>이득</h2><p className="muted small">살깡이(찬성)가 짚은 편익</p><ClaimList items={summary.benefits} /></article>
      <article className="card"><h2>불편</h2><p className="muted small">말깡이(반대)가 짚은 부담과 조건</p><ClaimList items={summary.costs} /></article>
      <article className="card"><h2>확인 필요</h2>{summary.checks.length ? <ul className="summary-items">{summary.checks.map((c) => (
        <li key={c.id}><p className="muted small">{c.sceneTitle}</p><p>{c.text}</p>
          {c.sceneIndex !== undefined && <button type="button" className="link small" onClick={() => onReview(c.sceneIndex!)}>이 장면 확인하기 →</button>}</li>
      ))}</ul> : <p className="muted">확인한 자료에서 별도로 표시된 항목이 없어요.</p>}</article>
    </div>
    {summary.withdrawn.length > 0 && <details className="card"><summary>철회한 주장 보기 (현재 이득·불편에서 제외)</summary><ClaimList items={summary.withdrawn} /></details>}
    {product.sources.length > 0 && <details className="card"><summary>제품 자료 출처</summary><ul className="summary-items">{product.sources.map((s) => (
      <li key={s.id}><p>{s.kind === 'catalog' ? `제조사 공식 · 확인일 ${s.checked_at ?? '확인 필요'}` : s.kind === 'example' ? '예시 자료 · 실제 제품 아님' : s.kind === 'ai' ? 'AI가 찾은 정보 · 확인 필요' : '사용자가 제공한 자료'}</p>
        {s.url && <a className="url small" href={s.url} target="_blank" rel="noopener noreferrer">{s.url}</a>}</li>
    ))}</ul></details>}
    <section className="card my-decision">
      <h2>내 선택은</h2>
      <fieldset className="decision-choices"><legend className="sr-only">구매 결정</legend>
        {(Object.keys(DECISIONS) as NonNullable<DecisionDraft['choice']>[]).map((choice) => <label className="chip" key={choice}>
          <input type="radio" name="decision" value={choice} checked={draft.choice === choice} onChange={() => onChange({ ...draft, choice })} />{DECISIONS[choice]}
        </label>)}
      </fieldset>
      <label htmlFor="decision_reason">결정 이유 <span className="muted small">(선택 · 최대 500자)</span></label>
      <textarea id="decision_reason" maxLength={500} rows={3} value={draft.reason} onChange={(e) => onChange({ ...draft, reason: e.target.value })} placeholder="내게 중요했던 이득, 감수할 불편, 더 알아볼 것을 적어 보세요." />
      <p className="muted small">탭을 닫거나 새 검토를 시작하면 사라져요. 서버에는 저장하지 않아요.</p>
      <button type="button" className="primary" disabled={!draft.choice} onClick={copyDecision}>내 결정 요약 복사</button>
      {copy?.text === text && <p role="status">{copy.status === 'success' ? '내 결정 요약을 복사했어요.' : '자동 복사가 안 돼요. 아래 내용을 선택해서 직접 복사해 주세요.'}</p>}
      {copy?.text === text && copy.status === 'manual' && <textarea aria-label="직접 복사할 결정 요약" rows={10} readOnly value={text} onFocus={(e) => e.target.select()} />}
    </section>
    <div className="row between nav-row"><button type="button" className="link" onClick={() => onReview(summary.total - 1)}>← 청문회로 돌아가기</button>
      <button type="button" className="secondary" onClick={onRestart}>다른 제품으로 새 검토</button></div>
  </section>
}
