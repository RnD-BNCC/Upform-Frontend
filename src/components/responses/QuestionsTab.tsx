import { useState } from 'react'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import type { FormField, FormResponse } from '@/types/form'
import QuestionSummaryCard from './QuestionSummaryCard'

interface QuestionsTabProps {
  responses: FormResponse[]
  allFields: FormField[]
}

const NON_QUESTION_TYPES = new Set(['title_block', 'image_block'])

export default function QuestionsTab({ responses, allFields }: QuestionsTabProps) {
  const questionFields = allFields.filter((f) => !NON_QUESTION_TYPES.has(f.type))
  const [currentIndex, setCurrentIndex] = useState(0)

  if (questionFields.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No questions to display</p>
  }

  const field = questionFields[currentIndex]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-200 px-4 py-3">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <CaretLeftIcon size={18} className="text-gray-600" />
        </button>

        <select
          value={currentIndex}
          onChange={(e) => setCurrentIndex(Number(e.target.value))}
          className="text-sm text-gray-700 font-medium bg-transparent border-none focus:outline-none cursor-pointer text-center"
        >
          {questionFields.map((f, i) => (
            <option key={f.id} value={i}>
              Question {i + 1} of {questionFields.length}
            </option>
          ))}
        </select>

        <button
          onClick={() => setCurrentIndex((i) => Math.min(questionFields.length - 1, i + 1))}
          disabled={currentIndex === questionFields.length - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <CaretRightIcon size={18} className="text-gray-600" />
        </button>
      </div>

      <QuestionSummaryCard
        key={field.id}
        field={field}
        responses={responses}
        questionNumber={currentIndex + 1}
      />
    </div>
  )
}
