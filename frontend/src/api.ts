import type { CatalogProduct, Category, Hearing, HearingRequest, IntakeInput, Product } from './types'

export type FieldErrors = Partial<Record<keyof IntakeInput, string>>

export class ApiError extends Error {
  fields: FieldErrors
  constructor(message: string, fields: FieldErrors = {}) {
    super(message)
    this.fields = fields
  }
}

const FIELD_MESSAGES: Record<keyof IntakeInput, string> = {
  category: '지원하는 제품군 중에서 골라 주세요.',
  product_text: '제품 정보를 입력해 주세요. (최대 5000자)',
  reason: '구매 이유를 한 줄로 입력해 주세요. (최대 200자)',
  catalog_model: '목록에서 제품 모델을 선택해 주세요.',
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(path, init)
  } catch {
    throw new ApiError('서버에 연결하지 못했어요. 입력한 내용은 그대로 있어요. 잠시 후 다시 시도해 주세요.')
  }
  if (res.status === 422) {
    // 서버 검증 오류를 필드별 한국어 안내로 바꾼다.
    const body = await res.json().catch(() => ({ detail: [] }))
    if (typeof body.detail === 'string') throw new ApiError(body.detail) // 서버가 준 한국어 사유
    const fields: FieldErrors = {}
    for (const d of body.detail ?? []) {
      const field = d.loc?.[1] as keyof IntakeInput | undefined
      if (field && field in FIELD_MESSAGES) fields[field] = FIELD_MESSAGES[field]
    }
    throw new ApiError('입력값을 확인해 주세요.', fields)
  }
  if (!res.ok) throw new ApiError('요청을 처리하지 못했어요. 입력한 내용은 그대로 있어요. 다시 시도해 주세요.')
  return res.json()
}

const post = <T>(path: string, data: unknown) =>
  request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

export const submitIntake = (input: IntakeInput) => post<Product>('/api/intake', input)

export const fetchExample = () => request<Product>('/api/example')

export const fetchCatalog = (category: Category) =>
  request<CatalogProduct[]>(`/api/catalog?category=${encodeURIComponent(category)}`)

export const fetchHearing = (req: HearingRequest) => post<Hearing>('/api/hearing', req)
