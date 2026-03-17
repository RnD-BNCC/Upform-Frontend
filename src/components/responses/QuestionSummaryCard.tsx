import { motion } from 'framer-motion'
import type { FormField, FormResponse } from '@/types/form'
import {
  aggregateChoiceResponses,
  aggregateCheckboxResponses,
  aggregateScaleResponses,
  collectTextResponses,
  countFieldResponses,
} from '@/utils/response-aggregation'
import PieChartCard from './charts/PieChartCard'
import BarChartCard from './charts/BarChartCard'
import TextResponseList from './charts/TextResponseList'
import FileResponseList from './charts/FileResponseList'

interface QuestionSummaryCardProps {
  field: FormField
  responses: FormResponse[]
  questionNumber: number
}

export default function QuestionSummaryCard({
  field,
  responses,
  questionNumber,
}: QuestionSummaryCardProps) {
  const answered = countFieldResponses(field.id, responses)

  const renderVisualization = () => {
    switch (field.type) {
      case 'multiple_choice':
      case 'dropdown': {
        const data = aggregateChoiceResponses(field.id, field.options ?? [], responses)
        return <PieChartCard data={data} />
      }
      case 'checkbox': {
        const data = aggregateCheckboxResponses(field.id, field.options ?? [], responses)
        return <BarChartCard data={data} layout="horizontal" colorful />
      }
      case 'rating': {
        const min = field.scaleMin ?? 1
        const max = field.scaleMax ?? 5
        const data = aggregateScaleResponses(field.id, min, max, responses)
        return <BarChartCard data={data} />
      }
      case 'linear_scale': {
        const min = field.scaleMin ?? 1
        const max = field.scaleMax ?? 10
        const data = aggregateScaleResponses(field.id, min, max, responses)
        return <BarChartCard data={data} />
      }
      case 'file_upload': {
        const values = collectTextResponses(field.id, responses)
        return <FileResponseList values={values} />
      }
      default: {
        const values = collectTextResponses(field.id, responses)
        return <TextResponseList values={values} />
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
    >
      <div className="mb-3">
        <h3 className="text-[15px] font-medium text-gray-900">
          {questionNumber}. {field.label}
        </h3>
        <p className="text-sm text-gray-400 mt-0.5">
          {answered} response{answered !== 1 ? 's' : ''}
        </p>
      </div>
      {renderVisualization()}
    </motion.div>
  )
}
