import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, ArrowUp } from '@phosphor-icons/react'
import type { QAResult } from '@/types/polling'

export default function QAFeed({
  data,
  textColor = '#111827',
  highlightedVoteId,
  onNext,
  onPrev,
  onMarkAnswered,
}: {
  data: QAResult
  textColor?: string
  highlightedVoteId?: string | null
  onNext?: () => void
  onPrev?: () => void
  onMarkAnswered?: (voteId: string) => void
}) {
  const unanswered = data.filter((q) => !q.isAnswered)
  const answeredCount = data.filter((q) => q.isAnswered).length
  const totalCount = data.length
  const currentQuestion = highlightedVoteId
    ? (data.find((q) => q.voteId === highlightedVoteId) ?? unanswered[0] ?? null)
    : (unanswered[0] ?? null)

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for questions...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto gap-6 px-8">
      <p className="text-sm font-semibold tabular-nums" style={{ color: textColor, opacity: 0.45 }}>
        {answeredCount}/{totalCount} answered
      </p>

      <AnimatePresence mode="wait">
        {currentQuestion ? (
          <motion.div
            key={currentQuestion.voteId ?? currentQuestion.text}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className="text-center w-full"
          >
            <p
              className={'text-3xl sm:text-4xl font-bold leading-snug ' + (currentQuestion.isAnswered ? 'line-through' : '')}
              style={{ color: textColor, opacity: currentQuestion.isAnswered ? 0.4 : 1 }}
            >
              {currentQuestion.text}
            </p>
            <p className="text-sm font-medium mt-4" style={{ color: textColor, opacity: 0.35 }}>
              — {currentQuestion.participantName}
            </p>
          </motion.div>
        ) : (
          <motion.div key="all-answered" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-2xl font-bold text-center" style={{ color: textColor }}>
              All questions answered!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-2">
        {onPrev && (
          <button
            onClick={onPrev}
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
            style={{ borderColor: textColor + '25', color: textColor, opacity: 0.45 }}
          >
            <ArrowUp size={15} weight="bold" />
          </button>
        )}
        {onNext && (
          <button
            onClick={onNext}
            className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
            style={{ borderColor: textColor + '40', color: textColor, opacity: 0.7 }}
          >
            <ArrowDown size={15} weight="bold" />
          </button>
        )}
      </div>

      {currentQuestion && !currentQuestion.isAnswered && onMarkAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <span
            className="px-2 py-0.5 rounded text-xs font-bold"
            style={{ backgroundColor: textColor, color: textColor === '#FFFFFF' ? '#111827' : '#FFFFFF' }}
          >
            ENTER
          </span>
          <span className="text-xs font-medium" style={{ color: textColor, opacity: 0.45 }}>
            to mark as answered
          </span>
        </motion.div>
      )}
    </div>
  )
}
