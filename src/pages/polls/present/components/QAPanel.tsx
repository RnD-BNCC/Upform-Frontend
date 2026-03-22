import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Heart, X } from '@phosphor-icons/react'
import type { QAQuestion } from '@/types/polling'

interface QAPanelProps {
  questions: QAQuestion[]
  navigateToIndex?: number | null
  onClose: () => void
}

const slideVariants = {
  enterDown: { y: '30%', opacity: 0 },
  enterUp: { y: '-30%', opacity: 0 },
  center: { y: 0, opacity: 1 },
  exitDown: { y: '30%', opacity: 0 },
  exitUp: { y: '-30%', opacity: 0 },
}

export default function QAPanel({ questions, navigateToIndex, onClose }: QAPanelProps) {
  const [currentIndex, setCurrentIndex] = useState(navigateToIndex ?? 0)
  const [direction, setDirection] = useState<'down' | 'up'>('down')

  useEffect(() => {
    if (navigateToIndex !== null && navigateToIndex !== undefined) {
      setDirection('down')
      setCurrentIndex(navigateToIndex)
    }
  }, [navigateToIndex])

  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < questions.length - 1

  const handlePrev = () => {
    if (!canGoPrev) return
    setDirection('up')
    setCurrentIndex((i) => i - 1)
  }

  const handleNext = () => {
    if (!canGoNext) return
    setDirection('down')
    setCurrentIndex((i) => i + 1)
  }

  const activeQuestion: QAQuestion | undefined = questions[currentIndex]

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="absolute right-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-md shadow-2xl z-30 flex flex-col overflow-hidden border-l border-gray-100"
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Q&amp;A</h3>
          <p className="text-[10px] text-gray-400 font-medium">
            {questions.length} pertanyaan
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {questions.length === 0 ? (
          <p className="text-sm text-gray-300 text-center font-medium">
            Belum ada pertanyaan
          </p>
        ) : (
          <>
            <div className="w-full flex flex-col items-center gap-3">
              <p className="text-[10px] text-gray-400 font-semibold tabular-nums">
                {currentIndex + 1} / {questions.length}
              </p>

              <div className="w-full relative min-h-[140px] flex items-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeQuestion?.id ?? currentIndex}
                    variants={slideVariants}
                    initial={direction === 'down' ? 'enterDown' : 'enterUp'}
                    animate="center"
                    exit={direction === 'down' ? 'exitUp' : 'exitDown'}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100"
                  >
                    <p className="text-base font-semibold text-gray-800 leading-snug mb-3">
                      {activeQuestion?.text}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400 font-medium">
                        {activeQuestion?.authorName}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold">
                        <Heart size={12} weight="fill" className="text-red-400" />
                        {activeQuestion?.likeCount ?? 0}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handlePrev}
                disabled={!canGoPrev}
                className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp size={16} weight="bold" />
              </button>
              <button
                onClick={handleNext}
                disabled={!canGoNext}
                className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDown size={16} weight="bold" />
              </button>
            </div>
          </>
        )}
      </div>

      <div className="px-4 pb-3 shrink-0">
        <p className="text-[10px] text-gray-300 text-center">
          ↑/↓ navigasi pertanyaan
        </p>
      </div>
    </motion.div>
  )
}
