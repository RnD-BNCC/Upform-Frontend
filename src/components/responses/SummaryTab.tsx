import type { FormField, FormResponse } from '@/types/form'
import QuestionSummaryCard from './QuestionSummaryCard'
import { getResultFields } from './resultsResponseUtils'

interface SummaryTabProps {
  responses: FormResponse[]
  allFields: FormField[]
}

export default function SummaryTab({ responses, allFields }: SummaryTabProps) {
  const questionFields = getResultFields(allFields)

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
