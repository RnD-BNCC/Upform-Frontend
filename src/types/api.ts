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
  description?: string
  color?: string
}

export type UpdateEventPayload = {
  name?: string
  description?: string
  status?: 'draft' | 'active' | 'closed'
  color?: string
}

// Section payloads
export type CreateSectionPayload = {
  title?: string
  description?: string
}

export type UpdateSectionPayload = {
  title?: string
  description?: string
  order?: number
  fields?: FormField[]
}

// Response payloads
export type SubmitResponsePayload = {
  answers: Record<string, string | string[]>
}
