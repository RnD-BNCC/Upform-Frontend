import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ThumbsUp, Check, ArrowCounterClockwise } from '@phosphor-icons/react'
import QAFeed from '@/components/polling/visualizations/QAFeed'
import type { QAResult } from '@/types/polling'

interface QAPresenterModalProps {
  unansweredQA: QAResult
  answeredQA: QAResult
  highlightedVoteId: string | null
  onHighlight: (voteId: string | null) => void
  onMarkAnswered: (voteId: string) => void
  onNext: () => void
  onPrev: () => void
  onClose: () => void
  bgColor?: string
  textColor?: string
}

export default function QAPresenterModal({
  unansweredQA,
  answeredQA,
  highlightedVoteId,
  onHighlight,
  onMarkAnswered,
  onNext,
  onPrev,
  onClose,
  bgColor = '#FFFFFF',
  textColor = '#111827',
}: QAPresenterModalProps) {
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeTab, setActiveTab] = useState<'questions' | 'answered'>('questions')

  const sortedUnanswered = useMemo(
    () => [...unansweredQA].sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0)),
    [unansweredQA],
  )

  const displayList = activeTab === 'questions' ? sortedUnanswered : answeredQA
  const allData = useMemo(() => [...unansweredQA, ...answeredQA], [unansweredQA, answeredQA])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-8"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="rounded-2xl shadow-2xl flex overflow-hidden"
        style={{ width: '80vw', height: '80vh', maxHeight: 700 }}
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatePresence initial={false}>
          {showSidebar && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="border-r flex flex-col shrink-0 overflow-hidden"
              style={{ backgroundColor: bgColor, borderColor: textColor + '15' }}
            >
              <div className="px-4 pt-4 pb-3 shrink-0">
                <button
                  onClick={() => setShowSidebar(false)}
                  className="text-sm font-semibold rounded-full px-4 py-1.5 transition-colors cursor-pointer"
                  style={{ color: textColor, border: `1px solid ${textColor}30` }}
                >
                  Hide
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 pb-2">
                {displayList.length === 0 ? (
                  <p className="text-sm text-center py-10" style={{ color: textColor, opacity: 0.3 }}>
                    {activeTab === 'questions' ? 'No unanswered questions' : 'No answered questions'}
                  </p>
                ) : (
                  displayList.map((item) => {
                    const isActive = item.voteId === highlightedVoteId
                    return (
                      <div
                        key={item.voteId ?? item.text}
                        onClick={() => onHighlight(item.voteId ?? null)}
                        className="p-3 rounded-xl mb-2 cursor-pointer transition-all"
                        style={{
                          border: `2px solid ${isActive ? textColor + '40' : 'transparent'}`,
                          backgroundColor: isActive ? textColor + '10' : undefined,
                        }}
                      >
                        <p className="text-sm font-medium leading-snug" style={{ color: textColor }}>{item.text}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: textColor, opacity: 0.5 }}>
                            <ThumbsUp size={11} weight="fill" />
                            <span>{item.likeCount ?? 0}</span>
                          </div>
                          {activeTab === 'questions' ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (item.voteId) onMarkAnswered(item.voteId)
                              }}
                              className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-all cursor-pointer hover:opacity-100"
                              style={{ color: textColor, opacity: 0.4, backgroundColor: 'transparent' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = textColor + '10'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Check size={14} weight="bold" />
                              <span className="font-medium">Mark as answered</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (item.voteId) onMarkAnswered(item.voteId)
                              }}
                              className="flex items-center gap-1 text-xs rounded-lg px-2 py-1 transition-all cursor-pointer hover:opacity-100"
                              style={{ color: textColor, opacity: 0.4, backgroundColor: 'transparent' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = textColor + '10'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <ArrowCounterClockwise size={12} weight="bold" />
                              <span className="font-medium">Restore</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="flex border-t shrink-0" style={{ borderColor: textColor + '15' }}>
                <button
                  onClick={() => setActiveTab('questions')}
                  className="flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer"
                  style={{
                    borderColor: activeTab === 'questions' ? textColor : 'transparent',
                    color: textColor,
                    opacity: activeTab === 'questions' ? 1 : 0.4,
                  }}
                >
                  <span className="block text-base font-bold">{unansweredQA.length}</span>
                  Questions
                </button>
                <button
                  onClick={() => setActiveTab('answered')}
                  className="flex-1 py-3 text-xs font-bold text-center border-b-2 transition-colors cursor-pointer"
                  style={{
                    borderColor: activeTab === 'answered' ? textColor : 'transparent',
                    color: textColor,
                    opacity: activeTab === 'answered' ? 1 : 0.4,
                  }}
                >
                  <span className="block text-base font-bold">{answeredQA.length}</span>
                  Answered
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: bgColor }}>
          <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
            {!showSidebar ? (
              <button
                onClick={() => setShowSidebar(true)}
                className="text-sm font-semibold rounded-full px-4 py-1.5 transition-colors cursor-pointer"
                style={{
                  color: textColor,
                  border: `1px solid ${textColor}30`,
                }}
              >
                See all questions
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors"
              style={{ color: textColor, opacity: 0.5 }}
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <QAFeed
              data={allData}
              textColor={textColor}
              highlightedVoteId={highlightedVoteId}
              onNext={onNext}
              onPrev={onPrev}
              onMarkAnswered={onMarkAnswered}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
