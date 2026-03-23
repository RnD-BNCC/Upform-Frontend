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

export interface FormField {
  id: string
  type: FieldType
  label: string
  required: boolean
  placeholder?: string
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
}

export interface FormSection {
  id: string
  title: string
  description?: string
  fields: FormField[]
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
  description: string
  status: 'draft' | 'active' | 'closed'
  updatedAt: string
  responseCount: number
  color: string
  image?: string | null
  sections: FormSection[]
  responses?: FormResponse[]
}
