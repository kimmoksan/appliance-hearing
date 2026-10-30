import type { Scene } from './scenes'
import type { Claim, DecisionDraft, Evidence, Hearing, Product } from './types'

export const DECISIONS = { buy: '살래요', hold: '보류', decline: '안 살래요' }
export const EVIDENCE_LABEL = { product_fact: '제품 사실', user_statement: '사용자 진술', assumption: '가정', unverified: '확인 필요' }

export type SummaryClaim = { id: string; sceneTitle: string; claim: Claim; evidence: Evidence[] }
export type SummaryCheck = { id: string; text: string; sceneTitle: string; sceneIndex?: number }

export function summarize(product: Product, scenes: Pick<Scene, 'id' | 'title'>[], hearings: Record<string, Hearing>) {
  const benefits: SummaryClaim[] = []
  const costs: SummaryClaim[] = []
  const withdrawn: SummaryClaim[] = []
  const checks: SummaryCheck[] = []
  const answers: { id: string; sceneTitle: string; question: string; answer: string }[] = []
  let completed = 0
  scenes.forEach((scene, sceneIndex) => {
    const hearing = hearings[scene.id]
    if (!hearing || hearing.scene_id !== scene.id) {
      checks.push({ id: `${scene.id}:missing`, sceneTitle: scene.title, sceneIndex, text: '이 장면의 공방을 아직 확인하지 않았어요. 확인한 내용만 요약에 담아요.' })
      return
    }
    completed++
    if (hearing.question) {
      const answer = hearing.question.options.find((o) => o.id === hearing.answered)?.label
      const answerText = answer ?? (hearing.answered === 'skip' ? '확인 안 함 (건너뜀)' : '확인 안 함')
      answers.push({ id: `${scene.id}:${hearing.question.id}`, sceneTitle: scene.title, question: hearing.question.text, answer: answerText })
      if (!answer) checks.push({ id: `${scene.id}:question`, sceneTitle: scene.title, sceneIndex, text: `${hearing.question.text} — ${answerText}` })
    }
    const evidenceById = new Map(hearing.evidence.map((e) => [e.id, e]))
    hearing.claims.forEach((claim) => {
      const evidence = claim.evidence_ids.flatMap((id) => evidenceById.has(id) ? [evidenceById.get(id)!] : [])
      const item = { id: `${scene.id}:${claim.id}`, sceneTitle: scene.title, claim, evidence }
      const invalid = !evidence.length || evidence.length !== claim.evidence_ids.length || evidence.some(
        (e) => e.kind === 'product_fact' && !product.sources.some((s) => s.id === e.source_id),
      )
      if (invalid) {
        checks.push({ id: `${item.id}:invalid`, sceneTitle: scene.title, text: '주장과 출처의 연결을 확인하지 못해 이 주장 요약을 보류했어요.' })
      } else if (claim.status === 'withdrawn') {
        withdrawn.push(item)
      } else {
        (claim.side === 'pro' ? benefits : costs).push(item)
      }
    })
    hearing.evidence.filter((e) => e.kind === 'unverified').forEach((e) => {
      checks.push({ id: `${scene.id}:${e.id}`, sceneTitle: scene.title, text: e.text })
    })
  })
  product.specs.filter((s) => s.status === 'needs_check').forEach((s) => {
    checks.push({ id: `spec:${s.key}`, sceneTitle: '제품 사양', text: `${s.label}: ${s.value || '확인 필요'}` })
  })
  return { benefits, costs, withdrawn, checks, answers, completed, total: scenes.length }
}

export function decisionText(product: Product, summary: ReturnType<typeof summarize>, draft: DecisionDraft) {
  const claims = (items: SummaryClaim[]) => items.length ? items.map((item) => [
    `- [${item.sceneTitle}] ${item.claim.text}${item.claim.status === 'revised' ? ' (수정된 주장)' : ''}`,
    ...(item.claim.change_reason ? [`  변경 이유: ${item.claim.change_reason}`] : []),
    ...item.evidence.map((e) => `  근거 · ${EVIDENCE_LABEL[e.kind]}: ${e.text}`),
  ].join('\n')).join('\n') : '- 확인한 공방에 해당 내용이 없어요.'
  return [
    '내 결정 정리 · 예시 공방 / 실제 AI 응답 아님',
    `제품: ${product.name}`, `구매 이유: ${product.reason}`,
    `확인한 공방: ${summary.completed} / ${summary.total}`,
    ...(summary.answers.length ? ['', '내 답변', ...summary.answers.map((a) => `- [${a.sceneTitle}] ${a.question}: ${a.answer}`)] : []),
    '', '이득 (공방의 주장)', claims(summary.benefits), '', '불편 (공방의 주장)', claims(summary.costs),
    '', '확인 필요', summary.checks.length ? summary.checks.map((c) => `- [${c.sceneTitle}] ${c.text}`).join('\n') : '- 확인한 자료에서 별도로 표시된 항목이 없어요.',
    ...(summary.withdrawn.length ? ['', '철회된 주장 (현재 이득·불편에서 제외)', claims(summary.withdrawn)] : []),
    '', `내 결정: ${draft.choice ? DECISIONS[draft.choice] : '아직 선택하지 않음'}`,
    `내 결정 이유: ${draft.reason.trim() || '작성하지 않음'}`,
    '', '제품 자료 출처', ...product.sources.map((s) => `- ${s.kind === 'catalog' ? '제조사 공식' : s.kind === 'example' ? '예시 자료' : '사용자가 제공한 자료'}${s.checked_at ? ` · 확인일 ${s.checked_at}` : ''}${s.url ? ` · ${s.url}` : ''}`),
    '', '가정·미확인은 제품의 확인된 사실이 아니에요. 구매 결정은 사용자가 직접 했어요.',
    '결정은 현재 탭에서만 유지되며 서버에 저장되지 않아요.',
  ].join('\n')
}
