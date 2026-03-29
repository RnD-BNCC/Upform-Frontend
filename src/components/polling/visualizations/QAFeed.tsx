import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowDown, ArrowUp, ThumbsUp, CheckCircle } from '@phosphor-icons/react'
import type { QAResult } from '@/types/polling'

const slideVariants = {
  enterDown: { y: 40, opacity: 0 },
  enterUp: { y: -40, opacity: 0 },
  center: { y: 0, opacity: 1 },
  exitDown: { y: 40, opacity: 0 },
  exitUp: { y: -40, opacity: 0 },
}

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
  const [direction, setDirection] = useState<'down' | 'up'>('down')

  const combined = useMemo(() => {
    const unanswered = [...data.filter((q) => !q.isAnswered)].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0))
    const answered = data.filter((q) => q.isAnswered)
    return [...unanswered, ...answered]
  }, [data])

  const answeredCount = data.filter((q) => q.isAnswered).length
  const totalCount = data.length
  const currentQuestion = highlightedVoteId
    ? (combined.find((q) => q.voteId === highlightedVoteId) ?? combined[0] ?? null)
    : (combined[0] ?? null)

  const handleNext = useCallback(() => {
    setDirection('down')
    onNext?.()
  }, [onNext])

  const handlePrev = useCallback(() => {
    setDirection('up')
    onPrev?.()
  }, [onPrev])

  const currentIndex = currentQuestion
    ? combined.findIndex((q) => q.voteId === currentQuestion.voteId)
    : 0
  const showUpArrow = onPrev && currentIndex > 0

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-lg" style={{ color: textColor, opacity: 0.4 }}>
        Waiting for questions...
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-2xl mx-auto gap-10 px-8">
      <button
        onClick={handlePrev}
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 cursor-pointer ${showUpArrow ? '' : 'invisible'}`}
        style={{ borderColor: textColor + '25', color: textColor, opacity: 0.45 }}
      >
        <ArrowUp size={15} weight="bold" />
      </button>

      <p className="text-sm font-semibold tabular-nums" style={{ color: textColor, opacity: 0.45 }}>
        {answeredCount}/{totalCount} answered
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {currentQuestion ? (
          <motion.div
            key={currentQuestion.voteId ?? currentQuestion.text}
            variants={slideVariants}
            initial={direction === 'down' ? 'enterDown' : 'enterUp'}
            animate="center"
            exit={direction === 'down' ? 'exitUp' : 'exitDown'}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="text-center w-full"
          >
            <p
              className={'text-3xl sm:text-4xl font-bold leading-snug ' + (currentQuestion.isAnswered ? 'line-through' : '')}
              style={{ color: textColor, opacity: currentQuestion.isAnswered ? 0.4 : 1 }}
            >
              {currentQuestion.text}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-4" style={{ color: textColor, opacity: 0.7 }}>
              <ThumbsUp size={14} weight="fill" />
              <span className="text-sm font-medium">{currentQuestion.likeCount ?? 0}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div key="all-answered" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-2xl font-bold text-center" style={{ color: textColor }}>
              All questions answered!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {onNext && (
        <button
          onClick={handleNext}
          className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
          style={{ borderColor: textColor + '40', color: textColor, opacity: 0.7 }}
        >
          <ArrowDown size={15} weight="bold" />
        </button>
      )}

      {currentQuestion && onMarkAnswered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ backgroundColor: textColor === '#FFFFFF' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }}
        >
          {currentQuestion.isAnswered ? (
            <>
              <CheckCircle size={14} weight="fill" style={{ color: textColor, opacity: 0.5 }} />
              <span className="text-xs font-semibold" style={{ color: textColor, opacity: 0.5 }}>Answered</span>
            </>
          ) : (
            <>
              <span className="text-xs font-medium" style={{ color: textColor, opacity: 0.5 }}>Press</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ backgroundColor: textColor, color: textColor === '#FFFFFF' ? '#111827' : '#FFFFFF' }}
              >
                ENTER
              </span>
              <span className="text-xs font-medium" style={{ color: textColor, opacity: 0.5 }}>
                to mark as answered
              </span>
            </>
          )}
        </motion.div>
      )}
    </div>
  )
}
