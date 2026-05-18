import type {
  FormAnalyticsEventType,
  FormAnswerValue,
  FormEvent,
  FormField,
  RespondentDeviceType,
} from './form'

// Event list response
export type EventListItem = Omit<FormEvent, 'responses' | 'sections'> & {
  sections?: FormEvent['sections']
}

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
    deleted: number
    totalResponses: number
  }
}

export type EventListParams = {
  page?: number
  take?: number
  status?: 'draft' | 'active' | 'closed'
  search?: string
  deleted?: boolean
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

export type SaveBuilderSectionPayload = UpdateSectionPayload & {
  sectionId: string
}

export type SaveBuilderEventPayload = {
  deletedSectionIds?: string[]
  event?: Pick<UpdateEventPayload, 'color' | 'image' | 'name' | 'theme'>
  sections?: SaveBuilderSectionPayload[]
}

// Response payloads
export type SubmitResponsePayload = {
  answers: Record<string, FormAnswerValue>
  deviceType?: RespondentDeviceType
  lotteryId?: string
  progressId?: string | null
  raffleNumber?: string
  respondentUuid?: string
  sectionHistory?: number[]
  startedAt?: string
  userAgent?: string
}

export type EventQuestionBank = Pick<FormEvent, 'id' | 'name'> & {
  sections: FormEvent['sections']
}

export type UpdateResponsePayload = {
  answers: Record<string, FormAnswerValue>
  lotteryId?: string
  raffleNumber?: string
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
  emailStyle?: 'formatted' | 'basic'
  emailThemeValue: string | null
  recipientFieldId: string
  recipientFieldIds?: string[]
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
  emailStyle: 'formatted' | 'basic'
  emailThemeValue: string | null
  recipientFieldId: string
  recipientFieldIds?: string[]
  subject: string
  body: string
  raffleEnabled: boolean
  rafflePrefix: string
  raffleSuffix: string
  raffleStart: number
  rafflePadding: number
}

export type PermissionAction =
  | 'responses.view'
  | 'responses.edit'
  | 'responses.delete'
  | 'forms.edit'
  | 'forms.delete'
  | 'forms.rollback'

export type PermissionRequest = {
  id: string
  requesterId?: string | null
  requesterEmail: string
  action: PermissionAction
  resourceType: string
  resourceId: string
  resourceKind?: string | null
  resourceName?: string | null
  resourceStatus?: string | null
  reason?: string | null
  status: 'pending' | 'approved' | 'rejected'
  approvedBy?: string | null
  approvedAt?: string | null
  rejectedBy?: string | null
  rejectedAt?: string | null
  expiresAt?: string | null
  usedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type PermissionRequestListResponse = {
  approver: boolean
  approverEmails: string[]
  data: PermissionRequest[]
}

export type PermissionAccessResponse = {
  allowed: boolean
  pending: boolean
  request?: Pick<PermissionRequest, 'createdAt' | 'id' | 'status'> | null
}

export type CreatePermissionRequestPayload = {
  action: PermissionAction
  reason?: string
  resourceId: string
  resourceType?: string
}

export type FormAuditLog = {
  id: string
  eventId: string
  action: string
  targetType: string
  targetId?: string | null
  actorEmail?: string | null
  beforeSnapshot?: unknown
  afterSnapshot?: unknown
  createdAt: string
}
