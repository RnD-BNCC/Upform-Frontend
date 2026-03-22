import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChatCircleText, Heart, X } from '@phosphor-icons/react'
import type { QAQuestion } from '@/types/polling'

interface QABadgeProps {
  questions: QAQuestion[]
  showPanel: boolean
  onOpenPanel: () => void
  onNavigateToQuestion: (index: number) => void
}

export default function QABadge({
  questions,
  showPanel,
  onOpenPanel,
  onNavigateToQuestion,
}: QABadgeProps) {
  const [showPopup, setShowPopup] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        badgeRef.current &&
        !badgeRef.current.contains(e.target as Node)
      ) {
        setShowPopup(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleBadgeClick = () => {
    setShowPopup((p) => !p)
  }

  const handleShowAll = () => {
    setShowPopup(false)
    setShowModal(true)
  }

  const handleSelectQuestion = (index: number) => {
    setShowModal(false)
    onNavigateToQuestion(index)
    if (!showPanel) onOpenPanel()
  }

  return (
    <>
      <div className="relative">
        <button
          ref={badgeRef}
          onClick={handleBadgeClick}
          className="relative flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 text-gray-600 hover:bg-white hover:border-primary-300 transition-all shadow-sm cursor-pointer"
        >
          <ChatCircleText size={15} weight="bold" />
          <span className="text-[11px] font-bold tabular-nums">{questions.length}</span>
        </button>

        <AnimatePresence>
          {showPopup && (
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50"
            >
              <button
                onClick={handleShowAll}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                Show All Questions ({questions.length})
              </button>
              <button
                onClick={() => {
                  setShowPopup(false)
                  onOpenPanel()
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
              >
                {showPanel ? 'Hide Q&A Panel' : 'Show Q&A Panel'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[70vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
                <h3 className="text-sm font-bold text-gray-800">
                  All Questions ({questions.length})
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
                {questions.length === 0 ? (
                  <p className="text-sm text-gray-300 text-center py-8">
                    Belum ada pertanyaan
                  </p>
                ) : (
                  questions.map((q, index) => (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(index)}
                      className="text-left p-3 rounded-xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50 transition-all cursor-pointer group"
                    >
                      <p className="text-sm text-gray-700 leading-snug mb-1 group-hover:text-primary-700">
                        {q.text}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-gray-400 font-medium">{q.authorName}</p>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                          <Heart size={10} weight="fill" className="text-red-400" />
                          {q.likeCount}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
