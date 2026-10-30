import assert from 'node:assert/strict'
import test from 'node:test'
import { decisionText, summarize } from '../src/decision.ts'

const product = {
  name: '검증용 제품', category: 'robot_vacuum', reason: '청소 부담 줄이기',
  specs: [{ key: 'power', label: '흡입력', value: '미확인', status: 'needs_check', source_id: 'src1' }],
  sources: [{ id: 'src1', kind: 'catalog', url: 'https://manufacturer.example/model', checked_at: '2026-10-30' }],
}
const scenes = [{ id: 's1', title: '일상' }, { id: 's2', title: '정리 부담' }, { id: 's3', title: '관리' }]
const claim = (id, side, text, extra = {}) => ({ id, side, text, evidence_ids: ['e1'], status: 'kept', ...extra })
const hearing = (scene_id, claims, text = '이 장면의 가정', extra = {}) => ({
  scene_id, claims, evidence: [{ id: 'e1', kind: 'assumption', text }], mode: 'mock', answered: null, ...extra,
})

test('같은 근거 ID라도 장면을 구분하고 찬반을 분리한다', () => {
  const result = summarize(product, scenes, {
    s1: hearing('s1', [claim('c1', 'pro', '이득')], '일상의 가정'),
    s2: hearing('s2', [claim('c1', 'con', '불편')], '정리의 가정'),
  })
  assert.equal(result.completed, 2)
  assert.equal(result.benefits[0].evidence[0].text, '일상의 가정')
  assert.equal(result.costs[0].evidence[0].text, '정리의 가정')
  assert.notEqual(result.benefits[0].id, result.costs[0].id)
})

test('수정된 최신 주장과 이유를 보존하고 철회 주장은 활성 요약에서 제외한다', () => {
  const result = summarize(product, scenes, { s1: hearing('s1', [
    claim('c1', 'pro', '유지된 이득'),
    claim('c2', 'con', '수정된 부담', { status: 'revised', change_reason: '사용자가 정리를 감수함' }),
    claim('c3', 'con', '철회한 부담', { status: 'withdrawn', change_reason: '근거를 철회함' }),
  ]) })
  assert.deepEqual(result.costs.map((i) => i.claim.text), ['수정된 부담'])
  assert.equal(result.costs[0].claim.change_reason, '사용자가 정리를 감수함')
  assert.equal(result.withdrawn[0].claim.text, '철회한 부담')
  assert.match(decisionText(product, result, { choice: 'hold', reason: '' }), /변경 이유: 사용자가 정리를 감수함/)
})

test('미확인 사양과 보지 않은 장면을 확인 필요에 남긴다', () => {
  const result = summarize(product, scenes, {})
  assert.equal(result.completed, 0)
  assert.equal(result.checks.filter((c) => c.sceneIndex !== undefined).length, 3)
  assert.ok(result.checks.some((c) => c.text === '흡입력: 미확인'))
  assert.equal(result.benefits.length, 0)
})

test('존재하지 않는 근거나 출처 없는 제품 사실을 주장으로 요약하지 않는다', () => {
  const result = summarize(product, scenes, {
    s1: hearing('s1', [claim('c1', 'pro', '잘못된 주장', { evidence_ids: ['missing'] })]),
    s2: hearing('s2', [claim('c1', 'pro', '출처 없는 사실')], '', { evidence: [{ id: 'e1', kind: 'product_fact', text: '성능', source_id: 'missing' }] }),
  })
  assert.equal(result.benefits.length, 0)
  assert.equal(result.checks.filter((c) => c.id.endsWith(':invalid')).length, 2)
})

test('복사 내용은 사용자의 선택·이유, 예시·가정·미확인·공식 출처를 포함한다', () => {
  const result = summarize(product, scenes, { s1: hearing('s1', [claim('c1', 'pro', '조건부 이득')]) })
  for (const [choice, label] of [['buy', '살래요'], ['hold', '보류'], ['decline', '안 살래요']]) {
    const text = decisionText(product, result, { choice, reason: '설치 공간을 더 확인할 예정' })
    assert.ok(text.includes(`내 결정: ${label}`))
    assert.ok(text.includes('내 결정 이유: 설치 공간을 더 확인할 예정'))
    assert.match(text, /실제 AI 응답 아님/)
    assert.match(text, /근거 · 가정/)
    assert.match(text, /흡입력: 미확인/)
    assert.match(text, /확인일 2026-10-30 · https:\/\/manufacturer.example\/model/)
    assert.match(text, /서버에 저장되지 않아요/)
  }
  assert.match(decisionText(product, result, { choice: null, reason: '' }), /내 결정: 아직 선택하지 않음/)
})

test('요약을 다시 만들어도 제품과 공방 원문은 바꾸지 않는다', () => {
  const hearings = { s1: hearing('s1', [claim('c1', 'pro', '조건부 이득')]) }
  const before = JSON.stringify({ product, hearings })
  assert.deepEqual(summarize(product, scenes, hearings), summarize(product, scenes, hearings))
  assert.equal(JSON.stringify({ product, hearings }), before)
})

test('선택한 답변과 미응답·건너뛴 질문을 구분해 화면·복사 데이터에 남긴다', () => {
  const question = { id: 'q1', text: '미리 정리해도 괜찮나요?', options: [{ id: 'ok', label: '괜찮아요' }] }
  for (const [answered, expected] of [[null, '확인 안 함'], ['skip', '확인 안 함 (건너뜀)'], ['ok', '괜찮아요']]) {
    const result = summarize(product, scenes, { s1: hearing('s1', [claim('c1', 'pro', '이득')], '가정', { question, answered }) })
    assert.equal(result.answers[0].answer, expected)
    assert.ok(decisionText(product, result, { choice: 'hold', reason: '' }).includes(`미리 정리해도 괜찮나요?: ${expected}`))
    assert.equal(result.checks.some((c) => c.id === 's1:question'), answered !== 'ok')
  }
})
