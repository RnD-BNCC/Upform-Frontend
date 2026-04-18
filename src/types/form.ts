export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'is_filled'
  | 'is_empty'

export interface ConditionLeaf {
  type: 'condition'
  fieldId: string
  operator: ConditionOperator
  value?: string
}

export interface ConditionGroup {
  type: 'group'
  logic: 'and' | 'or'
  items: ConditionNode[]
}

export type ConditionNode = ConditionLeaf | ConditionGroup

export type FieldType =
  | 'short_text'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkbox'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'email'
  | 'file_upload'
  | 'rating'
  | 'linear_scale'
  | 'title_block'
  | 'image_block'
  | 'banner_block'
  | 'ranking'
  | 'opinion_scale'
  | 'rich_text'
  | 'phone'
  | 'address'
  | 'number'
  | 'currency'

export interface FormField {
  id: string
  type: FieldType
  label: string
  required: boolean
  placeholder?: string
  defaultValue?: string
  options?: string[]
  /** Maps option value → target sectionId | 'end'. Only for multiple_choice / dropdown. */
  branches?: Record<string, string>
  /** Per-question description shown below the label. */
  description?: string
  /** Shuffle options on display. Only for multiple_choice / checkbox / dropdown. */
  shuffleOptions?: boolean
  /** Maps option value → image URL (base64 or object URL). For multiple_choice/checkbox/dropdown. */
  optionImages?: Record<string, string>
  /** Maps option value → image width percentage (20-100). For resized option images. */
  optionImageWidths?: Record<string, number>
  /** Image URL for title_block header or question header. */
  headerImage?: string
  /** Whether to include a free-text "Other" option. Only for multiple_choice / checkbox. */
  hasOtherOption?: boolean
  /** Correct answer(s) for quiz/answer-key mode. string for multiple_choice, string[] for checkbox. */
  correctAnswer?: string | string[]
  /** Linear scale min value (default 1). For rating type. */
  scaleMin?: number
  /** Linear scale max value (default 5). For rating type. */
  scaleMax?: number
  /** Label shown at the min end of the scale. */
  minLabel?: string
  /** Label shown at the max end of the scale. */
  maxLabel?: string
  /** Icon style for rating type. */
  ratingIcon?: 'star' | 'heart' | 'thumb'
  /** Horizontal alignment of headerImage. */
  imageAlign?: 'left' | 'center' | 'right'
  /** Width of headerImage as a percentage (default 100). */
  imageWidth?: number
  /** Caption text shown below headerImage. */
  imageCaption?: string
  /** Allowed file type categories. Only for file_upload. undefined = all types allowed. */
  allowedFileTypes?: string[]
  /** Maximum number of files. Default 1. Only for file_upload. */
  maxFileCount?: number
  /** Maximum file size in MB. Default 10. Only for file_upload. */
  maxFileSizeMb?: number
  /** When true, field is always hidden from respondent. */
  hideAlways?: boolean
  /** Whether conditions control showing or hiding this field. */
  conditionMode?: 'show' | 'hide'
  /** Nested conditional logic tree. */
  conditionTree?: ConditionGroup
  /** @deprecated use conditionTree. Legacy flat conditions array. */
  conditions?: Array<{
    fieldId: string
    operator: ConditionOperator
    value?: string
  }>
  /** Alert type for banner_block. */
  bannerType?: 'info' | 'warning' | 'error' | 'success'
  /** Half-width layout for side-by-side fields. */
  fieldWidth?: 'half'
  /** Per-sub-field placeholders for address type. */
  addressSubPlaceholders?: { street?: string; city?: string; state?: string; zip?: string }
  /** Per-sub-field default values for address type. */
  addressSubDefaults?: { street?: string; city?: string; state?: string; zip?: string }
  /** Minimum character/value length for validation. */
  validationMinLength?: number
  /** Maximum character/value length for validation. */
  validationMaxLength?: number
  /** Validation pattern preset or custom regex. */
  validationPattern?: 'none' | 'email' | 'url' | 'number' | string
  /** Custom error message shown when validation fails. */
  validationErrorMessage?: string
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  pageType?: 'cover' | 'page' | 'ending'
  settings?: Record<string, unknown>
  logicX?: number
  logicY?: number
}

export interface FormResponse {
  id: string
  submittedAt: string
  answers: Record<string, string | string[]>
}

export interface PieLabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}

export interface PieSectorProps {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
}

export interface FormEvent {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'closed'
  updatedAt: string
  responseCount: number
  color: string
  theme?: string
  image?: string | null
  sections: FormSection[]
  responses?: FormResponse[]
  spreadsheetId?: string | null
  spreadsheetUrl?: string | null
}
