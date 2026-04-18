import type { FormEvent, FormField } from './form'

// Event list response
export type EventListItem = Omit<FormEvent, 'responses'>

export type EventListResponse = {
  data: EventListItem[]
  meta: {
    page: number
    take: number
    total: number
    totalPages: number
  }
  counts: {
    total: number
    active: number
    totalResponses: number
  }
}

export type EventListParams = {
  page?: number
  take?: number
  status?: 'draft' | 'active' | 'closed'
  search?: string
}

export type CreateEventPayload = {
  name?: string
  color?: string
  theme?: string
}

export type UpdateEventPayload = {
  name?: string
  status?: 'draft' | 'active' | 'closed'
  color?: string
  image?: string | null
  theme?: string
}

export type UpdateSectionWithPageTypePayload = {
  title?: string
  description?: string
  order?: number
  fields?: FormField[]
  pageType?: string
}

// Section payloads
export type CreateSectionPayload = {
  title?: string
  description?: string
  pageType?: string
  order?: number
}

export type UpdateSectionPayload = {
  title?: string
  description?: string
  order?: number
  fields?: FormField[]
  pageType?: string
  settings?: Record<string, unknown>
  logicX?: number
  logicY?: number
}

// Response payloads
export type SubmitResponsePayload = {
  answers: Record<string, string | string[]>
}
