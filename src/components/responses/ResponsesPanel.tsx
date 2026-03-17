import { useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardTextIcon } from '@phosphor-icons/react'
import type { FormField, FormResponse, FormSection } from '@/types/form'
import SummaryTab from './SummaryTab'
import QuestionsTab from './QuestionsTab'
import IndividualTab from './IndividualTab'

type SubTab = 'summary' | 'questions' | 'individual'

interface ResponsesPanelProps {
  responses: FormResponse[]
  sections: FormSection[]
  allFields: FormField[]
}

const SUB_TABS: Array<{ key: SubTab; label: string }> = [
  { key: 'summary', label: 'Summary' },
  { key: 'questions', label: 'Questions' },
  { key: 'individual', label: 'Individual' },
]

export default function ResponsesPanel({ responses, sections, allFields }: ResponsesPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('summary')

  if (responses.length === 0) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex flex-col items-center justify-center gap-3 h-64">
          <ClipboardTextIcon size={44} weight="light" className="text-gray-300" />
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">No responses yet</p>
            <p className="text-xs text-gray-400 mt-0.5">Share your form to start collecting responses.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0 space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {responses.length} response{responses.length !== 1 ? 's' : ''}
          </h2>
        </div>

        <div className="flex gap-0 px-5 mt-4">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key)}
              className={`relative px-4 pb-3 text-sm font-medium transition-colors ${
                activeSubTab === tab.key
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeSubTab === tab.key && (
                <motion.div
                  layoutId="response-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary-500 rounded-t-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'summary' && (
        <SummaryTab responses={responses} allFields={allFields} />
      )}
      {activeSubTab === 'questions' && (
        <QuestionsTab responses={responses} allFields={allFields} />
      )}
      {activeSubTab === 'individual' && (
        <IndividualTab responses={responses} allFields={allFields} />
      )}
    </div>
  )
}
