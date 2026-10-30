import { useEffect, useState, type ReactNode } from 'react'
import { ApiError, fetchHearing } from '../api'
import Kkang, { type KkangPose } from '../components/Kkang'
import type { Claim, Evidence, EvidenceKind, Hearing, Product } from '../types'

type Props = {
  product: Product
  sceneId: string
  answer: string | null
  onAnswer: (answer: string) => void
  cached?: Hearing
  base?: Hearing
  onLoaded: (hearing: Hearing) => void
  top?: ReactNode
}

const KIND_LABEL: Record<EvidenceKind, string> = {
  product_fact: '제품 사실',
  user_statement: '사용자 진술',
  assumption: '가정',
  unverified: '확인 필요',
}
// 캐릭터는 말투만 다르다. 근거 규칙은 같고, 누구도 '사세요/사지 마세요'로 결론 내지 않는다.
const SIDE = {
  pro: { label: '살깡이', role: '찬성', intro: '이게 생기면 뭐가 좋아지는지 말해요' },
  con: { label: '말깡이', role: '반대', intro: '감당해야 할 부담을 콕 짚어 물어요' },
}
const STATUS = { revised: '주장 수정', withdrawn: '주장 철회' }

export default function HearingPanel({ product, sceneId, answer, onAnswer, cached, base, onLoaded, top }: Props) {
  const [response, setResponse] = useState<{ answer: string | null; hearing?: Hearing; error?: string } | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (cached && cached.answered === answer) return
    let alive = true
    fetchHearing({
      category: product.category,
      scene_id: sceneId,
      reason: product.reason,
      // AI가 웹에서 찾은 자료는 제품 사실 근거로 인용할 수 없게 뺀다.
      source_ids: product.sources.filter((s) => s.kind !== 'ai').map((s) => s.id),
      answer,
      facts: product.sources.slice(0, 5).map((s) => ({ source_id: s.id, text: s.text.slice(0, 3000), verified: s.kind !== 'ai' })),
      previous: answer ? base ?? cached ?? null : null,
    })
      .then((h) => {
        if (!alive) return
        setResponse({ answer, hearing: h })
        onLoaded(h)
      })
      .catch((e) => alive && setResponse({ answer, error: e instanceof ApiError ? e.message : '공방을 불러오지 못했어요.' }))
    return () => { alive = false }
  }, [product, sceneId, answer, retry, cached, base, onLoaded])

  const hearing = cached?.answered === answer ? cached : response?.answer === answer ? response.hearing : undefined
  const error = response?.answer === answer && !hearing ? response.error : undefined

  if (error) {
    return (
      <div className="card" role="alert">
        <p>{error}</p>
        <button type="button" className="secondary small" onClick={() => { setResponse(null); setRetry(retry + 1) }}>다시 시도</button>
      </div>
    )
  }
  if (!hearing) return (
    <div className="hearing-loading" role="status">
      <Kkang pose="guide_moderate" />
      <p className="muted">판깡이가 공방을 준비하고 있어요…</p>
    </div>
  )

  const claimById = new Map(hearing.claims.map((c) => [c.id, c]))
  const focus = claimById.get(selected ?? '') ?? hearing.claims[0]
  const changed = hearing.claims.filter((c) => c.status !== 'kept')

  return (
    <div className="hearing-grid">
      <div className="debate">
        {top}
        {hearing.mode === 'mock' && <p className="tag outline mode-tag">예시 공방 · 실제 AI 응답 아님</p>}
        {hearing.mode === 'live' && <p className="tag outline mode-tag">AI 공방 · 근거를 직접 확인하세요</p>}
        {hearing.notice && <p className="muted small" role="status">{hearing.notice}</p>}
        <p className="muted small cast">
          <strong>{SIDE.pro.label}</strong>(찬성) {SIDE.pro.intro} · <strong>{SIDE.con.label}</strong>(반대) {SIDE.con.intro} · <strong>판깡이</strong>(진행) 필요할 때만 물어봐요
        </p>
        <ol className="claims">
          {hearing.claims.map((c) => (
            <ClaimRow
              key={c.id}
              claim={c}
              repliesTo={c.replies_to ? claimById.get(c.replies_to) : undefined}
              evidence={hearing.evidence}
              active={c.id === focus.id}
              onSelect={() => setSelected(c.id)}
            />
          ))}
        </ol>

        {hearing.question && (
          <div className="question card">
            <figure className="speaker">
              <Kkang pose={hearing.answered ? 'guide_listen' : 'guide_present'} size="sm" />
              <figcaption className="tag outline small">판깡이</figcaption>
            </figure>
            <div className="question-body">
              <p id="q-text"><strong>{hearing.question.text}</strong> <span className="muted small">(선택 · 건너뛰어도 돼요)</span></p>
              <div className="row" role="group" aria-labelledby="q-text">
                {[...hearing.question.options, { id: 'skip', label: '건너뛰기' }].map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={hearing.answered === o.id ? 'primary small' : 'secondary small'}
                    aria-pressed={hearing.answered === o.id}
                    onClick={() => onAnswer(o.id)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className="card evidence-panel" aria-live="polite">
        <h2>근거 확인</h2>
        <p className="muted small">선택한 주장의 근거와 조건이에요.</p>
        <div className="focus">
          <p className="tags"><span className={`tag side-${focus.side}`}>{SIDE[focus.side].label}({SIDE[focus.side].role})</span></p>
          <p>“{focus.text}”</p>
        </div>
        <ul className="evidence-list">
          {focus.evidence_ids.map((id) => {
            const e = hearing.evidence.find((x) => x.id === id)
            if (!e) return null
            return (
              <li key={id}>
                <span className={`tag kind-${e.kind}`}>{KIND_LABEL[e.kind]}</span>
                <p>{e.text}</p>
              </li>
            )
          })}
        </ul>
        {changed.map((c) => (
          <div key={c.id} className="change card">
            <strong>↻ {SIDE[c.side].label} {STATUS[c.status as 'revised' | 'withdrawn']}</strong>
            <p className="small">{c.change_reason}</p>
          </div>
        ))}
      </aside>
    </div>
  )
}

// 발언 상태에 맞는 포즈. 주장 수정·철회는 인정하는 표정, 미확인 근거를 짚을 땐 말깡이가 돋보기를 든다.
function claimPose(claim: Claim, evidence: Evidence[]): KkangPose {
  const unverified = claim.evidence_ids.some((id) => evidence.find((e) => e.id === id)?.kind === 'unverified')
  if (claim.side === 'pro') {
    if (claim.status === 'withdrawn') return 'pro_shy'
    if (claim.status === 'revised') return 'pro_think'
    return claim.replies_to ? 'pro_excited' : 'pro_present'
  }
  if (claim.status !== 'kept') return 'con_relieved'
  if (claim.replies_to && claim.evidence_ids.some((id) => evidence.find((e) => e.id === id)?.kind === 'user_statement')) return 'con_note'
  if (unverified) return 'con_inspect'
  return claim.replies_to ? 'con_question' : 'con_curious'
}

function ClaimRow({ claim, repliesTo, evidence, active, onSelect }: { claim: Claim; repliesTo?: Claim; evidence: Evidence[]; active: boolean; onSelect: () => void }) {
  const side = SIDE[claim.side]
  return (
    <li className={`claim side-${claim.side}`}>
      <figure className="speaker">
        <Kkang pose={claimPose(claim, evidence)} className="portrait-frame" />
        <figcaption className={`tag side-${claim.side}`}>{side.label}</figcaption>
      </figure>
      <div className={`bubble ${active ? 'active' : ''}`}>
        {repliesTo && <p className="muted small">↳ {SIDE[repliesTo.side].label} 말에 대한 반문</p>}
        <p>
          {claim.text}
          {claim.status !== 'kept' && <span className="tag outline small status">{STATUS[claim.status]}</span>}
        </p>
        <button type="button" className="chip-btn" aria-pressed={active} onClick={onSelect}>
          근거 {claim.evidence_ids.length}개 보기 ›
        </button>
      </div>
    </li>
  )
}
