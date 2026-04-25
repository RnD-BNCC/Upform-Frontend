import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeftIcon, CaretRightIcon, CaretDownIcon } from '@phosphor-icons/react'
import type { FormField, FormResponse } from '@/types/form'
import QuestionSummaryCard from './QuestionSummaryCard'
import { getResultFields } from './resultsResponseUtils'

interface QuestionsTabProps {
  responses: FormResponse[]
  allFields: FormField[]
}

export default function QuestionsTab({ responses, allFields }: QuestionsTabProps) {
  const questionFields = getResultFields(allFields)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1 text-sm text-gray-700 font-medium hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
          >
            Question {currentIndex + 1} of {questionFields.length}
            <CaretDownIcon
              size={12}
              className={`text-gray-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.1 }}
                className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 min-w-44 max-h-60 overflow-y-auto"
              >
                {questionFields.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentIndex(i)
                      setDropdownOpen(false)
                    }}
                    className={`w-full px-4 py-2 text-sm text-center transition-colors cursor-pointer ${
                      currentIndex === i
                        ? 'text-primary-600 bg-primary-50 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Question {i + 1} of {questionFields.length}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
