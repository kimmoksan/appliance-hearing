export type Category = 'robot_vacuum' | 'dishwasher' | 'dryer' | 'air_purifier'

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'robot_vacuum', label: '로봇청소기' },
  { id: 'dishwasher', label: '식기세척기' },
  { id: 'dryer', label: '건조기' },
  { id: 'air_purifier', label: '공기청정기' },
]

export type IntakeInput = { category: Category; product_text: string; reason: string }

export type Spec = {
  key: string
  label: string
  value: string | null
  status: 'confirmed' | 'needs_check'
  source_id: string | null
}

export type Source = {
  id: string
  kind: 'user_input' | 'example' | 'link'
  text: string
  url: string | null
  received_at: string
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
