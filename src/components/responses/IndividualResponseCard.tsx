import { motion } from 'framer-motion'
import type { FormField, FormResponse } from '@/types/form'

interface IndividualResponseCardProps {
  response: FormResponse
  allFields: FormField[]
}

const NON_QUESTION_TYPES = new Set(['title_block', 'image_block'])

export default function IndividualResponseCard({ response, allFields }: IndividualResponseCardProps) {
  const questionFields = allFields.filter((f) => !NON_QUESTION_TYPES.has(f.type))

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100"
    >
      <div className="px-5 py-3">
        <p className="text-xs text-gray-400">
          Submitted on{' '}
          {new Date(response.submittedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}{' '}
          at{' '}
          {new Date(response.submittedAt).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {questionFields.map((field) => {
        const val = response.answers[field.id]
        const display = Array.isArray(val) ? val.join(', ') : (val || '—')

        return (
          <div key={field.id} className="px-5 py-3.5">
            <p className="text-xs font-medium text-gray-400 mb-1">{field.label}</p>
            <p className="text-sm text-gray-800">{display}</p>
          </div>
        )
      })}
    </motion.div>
  )
}
