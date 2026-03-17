import { useState } from 'react'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import type { FormField, FormResponse } from '@/types/form'
import IndividualResponseCard from './IndividualResponseCard'

interface IndividualTabProps {
  responses: FormResponse[]
  allFields: FormField[]
}

export default function IndividualTab({ responses, allFields }: IndividualTabProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (responses.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-8">No responses to display</p>
  }

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
          {responses.map((_, i) => (
            <option key={i} value={i}>
              {i + 1} of {responses.length}
            </option>
          ))}
        </select>

        <button
          onClick={() => setCurrentIndex((i) => Math.min(responses.length - 1, i + 1))}
          disabled={currentIndex === responses.length - 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <CaretRightIcon size={18} className="text-gray-600" />
        </button>
      </div>

      <IndividualResponseCard
        key={responses[currentIndex].id}
        response={responses[currentIndex]}
        allFields={allFields}
      />
    </div>
  )
}
