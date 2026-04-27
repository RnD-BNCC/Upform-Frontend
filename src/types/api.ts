import type {
  FormAnalyticsEventType,
  FormAnswerValue,
  FormEvent,
  FormField,
  RespondentDeviceType,
} from './form'

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
  answers: Record<string, FormAnswerValue>
  deviceType?: RespondentDeviceType
  progressId?: string | null
  respondentUuid?: string
  sectionHistory?: number[]
  startedAt?: string
  userAgent?: string
}

export type UpdateResponsePayload = {
  answers: Record<string, FormAnswerValue>
}

export type SaveResponseProgressPayload = {
  answers: Record<string, FormAnswerValue>
  currentSectionId?: string | null
  currentSectionIndex?: number
  deviceType?: RespondentDeviceType
  otherTexts?: Record<string, string>
  progressId?: string | null
  progressPercent?: number
  respondentUuid?: string
  sectionHistory?: number[]
  startedAt?: string
  userAgent?: string
}

export type TrackAnalyticsEventPayload = {
  answers?: Record<string, FormAnswerValue>
  currentSectionId?: string | null
  currentSectionIndex?: number
  deviceType?: RespondentDeviceType
  progressPercent?: number
  respondentUuid?: string
  sectionHistory?: number[]
  sessionUuid?: string
  type: FormAnalyticsEventType
  userAgent?: string
}

// Email blasts
export type EmailBlastStatus =
  | 'queued'
  | 'processing'
  | 'done'
  | 'failed'
  | 'partial_failed'
  | 'cancelled'

export type EmailBlast = {
  id: string
  eventId?: string | null
  subject: string
  html: string
  recipients: string[]
  status: EmailBlastStatus
  sentCount: number
  failedCount: number
  totalCount: number
  createdAt: string
  updatedAt: string
}

export type EmailLog = {
  id: string
  blastId: string
  recipient: string
  status: 'queued' | 'sent' | 'failed'
  error?: string
  attempt: number
  sentAt?: string
  createdAt: string
}

export type EmailBlastDetail = EmailBlast & { logs: EmailLog[] }

export type EmailBlastListResponse = {
  data: Omit<EmailBlast, 'html' | 'recipients'>[]
  meta: {
    page: number
    take: number
    total: number
    totalPages: number
  }
}

export type CreateEmailBlastPayload = {
  eventId?: string
  subject: string
  html: string
  recipients: string[]
}

export type EmailComposerDraft = {
  id: string
  eventId: string
  subject: string
  emailStyle: 'formatted' | 'basic'
  emailThemeValue: string | null
  blocks: unknown
  recipientMode: 'manual' | 'field'
  manualRecipients: string[]
  selectedEmailFieldIds: string[]
  excludedRecipients: string[]
  createdAt: string
  updatedAt: string
}

export type SaveEmailComposerDraftPayload = {
  eventId: string
  subject: string
  emailStyle: 'formatted' | 'basic'
  emailThemeValue: string | null
  blocks: unknown
  recipientMode: 'manual' | 'field'
  manualRecipients: string[]
  selectedEmailFieldIds: string[]
  excludedRecipients: string[]
}

export type SubmitFormSettings = {
  blocks: unknown
  id: string
  eventId: string
  enabled: boolean
  emailThemeValue: string | null
  recipientFieldId: string
  subject: string
  body: string
  raffleEnabled: boolean
  rafflePrefix: string
  raffleSuffix: string
  raffleStart: number
  rafflePadding: number
  createdAt: string
  updatedAt: string
}

export type SaveSubmitFormSettingsPayload = {
  eventId: string
  blocks: unknown
  enabled: boolean
  emailThemeValue: string | null
  recipientFieldId: string
  subject: string
  body: string
  raffleEnabled: boolean
  rafflePrefix: string
  raffleSuffix: string
  raffleStart: number
  rafflePadding: number
}
