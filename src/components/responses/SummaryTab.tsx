import type { FormField, FormResponse } from '@/types/form'
import QuestionSummaryCard from './QuestionSummaryCard'

interface SummaryTabProps {
  responses: FormResponse[]
  allFields: FormField[]
}

const NON_QUESTION_TYPES = new Set(['title_block', 'image_block'])

export default function SummaryTab({ responses, allFields }: SummaryTabProps) {
  const questionFields = allFields.filter((f) => !NON_QUESTION_TYPES.has(f.type))

  return (
    <div className="space-y-4">
      {questionFields.map((field, i) => (
        <QuestionSummaryCard
          key={field.id}
          field={field}
          responses={responses}
          questionNumber={i + 1}
        />
      ))}
    </div>
  )
}
