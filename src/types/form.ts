export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'is_filled'
  | 'is_empty'

export type ConditionSourceKind = 'field' | 'calculation' | 'date'

export interface ConditionLeaf {
  type: 'condition'
  fieldId: string
  sourceKind?: ConditionSourceKind
  sourceAmount?: number
  operator: ConditionOperator
  value?: string
}

export interface ConditionGroup {
  type: 'group'
  logic: 'and' | 'or'
  items: ConditionNode[]
}

export type ConditionNode = ConditionLeaf | ConditionGroup

export interface PageLogicBranchConfig {
  id: string
  toId: string
  label?: string
  conditionTree?: ConditionGroup
}

export interface PageLogicConfig {
  defaultBranchId?: string
  defaultTargetId?: string
  conditionalBranches?: PageLogicBranchConfig[]
  disableDefaultFallback?: boolean
}

export type CalculationType = 'number' | 'text' | 'duration'

export type CalculationDurationUnit =
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'

export interface CalculationRule {
  id: string
  conditionTree?: ConditionGroup
  operation?: 'set' | 'add' | 'subtract' | 'multiply' | 'divide'
  value?: string
}

export interface FormCalculation {
  id: string
  name: string
  type: CalculationType
  initialValue?: string
  durationStartValue?: string
  durationEndValue?: string
  durationUnit?: CalculationDurationUnit
  rules?: CalculationRule[]
}

export type FieldType =
  | 'short_text'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkbox'
  | 'multiselect'
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
  | 'divider'
  | 'thank_you_block'
  | 'fill_again_button'
  | 'url_button'
  | 'next_button'
  | 'single_checkbox'
  | 'long_text'

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
  /** Shuffle options on display. Only for multiple_choice / checkbox / multiselect / dropdown. */
  shuffleOptions?: boolean
  /** Maps option value → image URL (base64 or object URL). For multiple_choice/checkbox/multiselect/dropdown. */
  optionImages?: Record<string, string>
  /** Maps option value → image width percentage (20-100). For resized option images. */
  optionImageWidths?: Record<string, number>
  /** Image URL for title_block header or question header. */
  headerImage?: string
  /** Whether to include a free-text "Other" option. Only for multiple_choice / checkbox. */
  hasOtherOption?: boolean
  /** Correct answer(s) for quiz/answer-key mode. string for multiple_choice, string[] for checkbox / multiselect. */
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
  /** Minimum number of files required. Only for file_upload. */
  minFileCount?: number
  /** Whether to enforce the file size limit. Only for file_upload. */
  limitFileSize?: boolean
  /** Whether to show upload limits text to respondent. Only for file_upload. */
  showUploadLimits?: boolean
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
  /** Explicit row grouping for half-width pairs. Fields with same rowId render side-by-side. */
  rowId?: string
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
  /** Minimum number of selections required. Only for checkbox / multiselect / multiple_choice. */
  validationMinSelection?: number
  /** Maximum number of selections allowed. Only for checkbox / multiselect / multiple_choice. */
  validationMaxSelection?: number
  /** ISO currency code, e.g. 'USD', 'IDR'. Only for currency type. */
  currencyCode?: string
  /** Phone country code, e.g. 'US', 'ID'. Only for phone type. */
  countryCode?: string
  /** Show current value label on linear_scale slider. */
  displayCurrentValue?: boolean
  /** Format linear_scale value as percentage. */
  showValueAsPercentage?: boolean
  /** Subtitle for thank_you_block. */
  subtitle?: string
  /** Hide the checkmark icon on thank_you_block. */
  hideIcon?: boolean
  /** Custom error message shown when required validation fails (overrides default). */
  validationMessage?: string
  /** URL for url_button field type. */
  buttonUrl?: string
  /** Horizontal alignment of button (fill_again_button / url_button). */
  buttonAlign?: 'left' | 'center' | 'right' | 'full'
  /** Background color override for button fields. */
  buttonColor?: string
  /** Text/foreground color override for button fields. */
  textColor?: string
  /** Open url_button link in a new tab. */
  openInNewTab?: boolean
  /** Allow half-star increments for rating field. */
  allowHalfStar?: boolean
  /** Show skip button next to next_button. */
  showSkip?: boolean
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
  pageType?: 'cover' | 'page' | 'ending'
  settings?: {
    showFillAgain?: boolean
    nextButton?: {
      text?: string
      align?: 'left' | 'center' | 'right' | 'full'
      color?: string
      showSkip?: boolean
    }
    pageLogic?: PageLogicConfig
    calculations?: FormCalculation[]
    [key: string]: unknown
  }
  logicX?: number
  logicY?: number
  order?: number
}

export type FormAnswerValue = string | string[]

export type FormResponseStatus = 'submitted' | 'in_progress'

export type RespondentDeviceType = 'desktop' | 'tablet' | 'mobile' | 'unknown'

export interface FormResponse {
  id: string
  respondentUuid?: string
  uuid?: string
  status?: FormResponseStatus
  startedAt?: string
  updatedAt?: string
  completedAt?: string
  deviceType?: RespondentDeviceType
  userAgent?: string
  sectionHistory?: number[]
  currentSectionId?: string | null
  currentSectionIndex?: number
  progressPercent?: number
  submittedAt: string
  answers: Record<string, FormAnswerValue>
}

export interface FormResponseProgress {
  id: string
  eventId?: string
  respondentUuid?: string
  uuid?: string
  status?: 'in_progress'
  startedAt: string
  updatedAt: string
  answers: Record<string, FormAnswerValue>
  otherTexts?: Record<string, string>
  sectionHistory?: number[]
  currentSectionId?: string | null
  currentSectionIndex?: number
  progressPercent?: number
  deviceType?: RespondentDeviceType
  userAgent?: string
}

export type FormAnalyticsEventType = 'view' | 'start' | 'section_view' | 'finish'

export interface FormAnalyticsEvent {
  id: string
  eventId?: string
  type: FormAnalyticsEventType
  respondentUuid?: string
  sessionUuid?: string
  answers?: Record<string, FormAnswerValue>
  sectionHistory?: number[]
  sectionId?: string | null
  sectionIndex?: number
  progressPercent?: number
  deviceType?: RespondentDeviceType
  userAgent?: string
  occurredAt: string
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
