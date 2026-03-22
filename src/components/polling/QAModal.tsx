import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, ThumbsUp, ArrowLeft, ChatTeardropText, CheckCircle } from '@phosphor-icons/react'
import type { QAQuestion } from '@/types/polling'

const MAX_LENGTH = 200

interface QAModalProps {
  myUserId: string
  myName: string
  questions: QAQuestion[]
  onQuestionsChange: (updater: (prev: QAQuestion[]) => QAQuestion[]) => void
  submitQuestion: (text: string, authorName: string, authorId: string) => void
  toggleLike: (questionId: string, currentlyLiked: boolean, onRollback: () => void) => void
  onClose: () => void
}

type ModalView = 'list' | 'form' | 'thankyou'

export default function QAModal({
  myUserId,
  myName,
  questions,
  onQuestionsChange,
  submitQuestion,
  toggleLike,
  onClose,
}: QAModalProps) {
  const [view, setView] = useState<ModalView>('list')
  const [text, setText] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')

  useEffect(() => {
    if (view !== 'thankyou') return
    const timer = setTimeout(() => setView('list'), 2000)
    return () => clearTimeout(timer)
  }, [view])

  const handleSubmit = useCallback(() => {
    if (!text.trim() || text.length > MAX_LENGTH) return
    submitQuestion(text.trim(), myName, myUserId)
    setText('')
    setView('thankyou')
  }, [text, myName, myUserId, submitQuestion])

  const handleToggleLike = useCallback(
    (question: QAQuestion) => {
      if (question.authorId === myUserId) return

      const isLiked = question.likedByIds.includes(myUserId)

      onQuestionsChange((prev) =>
        prev.map((q) =>
          q.id === question.id
            ? {
                ...q,
                likeCount: isLiked ? q.likeCount - 1 : q.likeCount + 1,
                likedByIds: isLiked
                  ? q.likedByIds.filter((id) => id !== myUserId)
                  : [...q.likedByIds, myUserId],
              }
            : q,
        ),
      )

      const rollback = () => {
        onQuestionsChange((prev) =>
          prev.map((q) =>
            q.id === question.id
              ? {
                  ...q,
                  likeCount: isLiked ? q.likeCount + 1 : q.likeCount - 1,
                  likedByIds: isLiked
                    ? [...q.likedByIds, myUserId]
                    : q.likedByIds.filter((id) => id !== myUserId),
                }
              : q,
          ),
        )
      }

      toggleLike(question.id, isLiked, rollback)
    },
    [myUserId, onQuestionsChange, toggleLike],
  )

  const sortedQuestions = useMemo(() => {
    return [...questions].sort((a, b) =>
      sortBy === 'popular'
        ? b.likeCount - a.likeCount
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [questions, sortBy])

  const remaining = MAX_LENGTH - text.length
  const isOverLimit = remaining < 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="w-full max-w-md bg-white rounded-t-2xl shadow-2xl flex flex-col h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {view === 'thankyou' ? (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-bold text-gray-900">Q&amp;A</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle size={40} className="text-gray-300" weight="light" />
              <p className="text-base font-semibold text-gray-500">Thank you!</p>
            </div>
          </div>
        ) : view === 'form' ? (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-bold text-gray-900">Q&amp;A</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <button
                onClick={() => { setView('list'); setText('') }}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-700 cursor-pointer transition-colors self-start"
              >
                <ArrowLeft size={14} weight="bold" />
                Back
              </button>

              <h4 className="text-lg font-bold text-gray-900">New question</h4>

              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Your question to the presenter..."
                  rows={4}
                  autoFocus
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 resize-none pr-12 transition-all"
                />
                <span
                  className={`absolute bottom-3 right-3 text-[10px] font-semibold ${
                    isOverLimit ? 'text-red-500' : 'text-gray-300'
                  }`}
                >
                  {remaining}
                </span>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!text.trim() || isOverLimit}
                className="w-full py-3 text-sm font-bold text-white bg-primary-500 rounded-full hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Submit
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[80vh]">
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 shrink-0">
              <h3 className="text-base font-bold text-gray-900">Q&amp;A</h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer transition-colors"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="px-5 pt-3 shrink-0 flex gap-2">
              <button
                onClick={() => setSortBy('recent')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                  sortBy === 'recent'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-1.5 text-xs font-bold rounded-full transition-colors cursor-pointer ${
                  sortBy === 'popular'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                Popular
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-2">
              {sortedQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ChatTeardropText size={36} className="text-gray-200 mb-3" weight="bold" />
                  <p className="text-sm text-gray-400 font-medium">
                    Be the first to ask!
                  </p>
                </div>
              ) : (
                sortedQuestions.map((q) => {
                  const isLiked = q.likedByIds.includes(myUserId)
                  const isOwn = q.authorId === myUserId
                  return (
                    <div
                      key={q.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1 pr-3">
                        <p className="text-sm text-gray-800 leading-snug font-medium">{q.text}</p>
                      </div>
                      {!isOwn ? (
                        <button
                          onClick={() => handleToggleLike(q)}
                          className="flex flex-col items-center gap-0.5 shrink-0 cursor-pointer transition-all"
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              isLiked
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                            }`}
                          >
                            <ThumbsUp
                              size={15}
                              weight={isLiked ? 'fill' : 'regular'}
                            />
                          </div>
                          <span className={`text-[10px] font-bold ${isLiked ? 'text-gray-900' : 'text-gray-400'}`}>
                            {q.likeCount}
                          </span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-gray-300">
                            <ThumbsUp size={15} weight="fill" />
                          </div>
                          <span className="text-[10px] font-bold text-gray-300">{q.likeCount}</span>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="p-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setView('form')}
                className="w-full py-3 text-sm font-bold text-white bg-primary-500 rounded-full hover:bg-primary-600 transition-colors cursor-pointer"
              >
                Ask new question
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}