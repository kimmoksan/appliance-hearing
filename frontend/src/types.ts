export type Category = 'robot_vacuum' | 'dishwasher' | 'dryer' | 'air_purifier'

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'robot_vacuum', label: '로봇청소기' },
  { id: 'dishwasher', label: '식기세척기' },
  { id: 'dryer', label: '건조기' },
  { id: 'air_purifier', label: '공기청정기' },
]

export type CatalogProduct = { brand: string; model: string; name: string; url: string; status: string }
export type IntakeInput = { category: Category; product_text: string; reason: string; catalog_model?: string }

export type Spec = {
  key: string
  label: string
  value: string | null
  status: 'confirmed' | 'needs_check'
  source_id: string | null
}

export type Source = {
  id: string
  kind: 'user_input' | 'example' | 'link' | 'catalog'
  text: string
  url: string | null
  received_at: string
  checked_at?: string | null
}

export type Product = {
  category: Category
  name: string
  is_example: boolean
  link: string | null
  link_read: boolean
  reason: string
  specs: Spec[]
  sources: Source[]
  notices: string[]
}

export type EvidenceKind = 'product_fact' | 'user_statement' | 'assumption' | 'unverified'
export type Evidence = { id: string; kind: EvidenceKind; text: string; source_id: string | null }
export type Claim = {
  id: string
  side: 'pro' | 'con'
  text: string
  evidence_ids: string[]
  replies_to: string | null
  status: 'kept' | 'revised' | 'withdrawn'
  change_reason: string | null
}
export type Question = { id: string; text: string; options: { id: string; label: string }[] }
export type Hearing = {
  scene_id: string
  mode: 'mock' | 'live'
  evidence: Evidence[]
  claims: Claim[]
  question: Question | null
  answered: string | null
}
export type HearingRequest = {
  category: Category
  scene_id: string
  reason: string
  source_ids: string[]
  answer: string | null
}
