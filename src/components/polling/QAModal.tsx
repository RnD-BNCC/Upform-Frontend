import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Heart, PaperPlaneTilt, ChatTeardropText } from '@phosphor-icons/react'
import type { RefObject } from 'react'
import type { Socket } from 'socket.io-client'
import type { QAQuestion } from '@/types/polling'
import { useQASocket } from '@/hooks/useQASocket'

const MAX_LENGTH = 200

interface QAModalProps {
  pollId: string
  myUserId: string
  myName: string
  socketRef: RefObject<Socket | null>
  questions: QAQuestion[]
  onQuestionsChange: (updater: (prev: QAQuestion[]) => QAQuestion[]) => void
  onClose: () => void
}

export default function QAModal({
  pollId,
  myUserId,
  myName,
  socketRef,
  questions,
  onQuestionsChange,
  onClose,
}: QAModalProps) {
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { submitQuestion, toggleLike } = useQASocket({
    socketRef,
    pollId,
    myUserId,
    questions,
    onQuestionsChange,
  })

  const handleSubmit = useCallback(() => {
    if (!text.trim() || text.length > MAX_LENGTH) return

    setSubmitError(null)

    const socket = socketRef.current
    if (socket) {
      const onError = (err: { code: string; message: string }) => {
        if (err.code === 'LIMIT_EXCEEDED') {
          setSubmitError('Kamu sudah submit 5 pertanyaan')
        } else {
          setSubmitError(err.message ?? 'Terjadi kesalahan')
        }
        socket.off('question:error', onError)
      }
      socket.once('question:error', onError)

      setTimeout(() => {
        socket.off('question:error', onError)
      }, 5000)
    }

    submitQuestion(text.trim(), myName, myUserId)
    setText('')
    setShowForm(false)
    setSubmitSuccess(true)
    setTimeout(() => setSubmitSuccess(false), 3000)
  }, [text, myName, myUserId, submitQuestion, socketRef])

  const handleToggleLike = useCallback(
    (question: QAQuestion) => {
      if (question.authorId === myUserId) return

      const isLiked = question.likedByIds.includes(myUserId)

      // Optimistic update
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

  const remaining = MAX_LENGTH - text.length
  const isOverLimit = remaining < 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '20%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '20%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <ChatTeardropText size={16} weight="bold" className="text-primary-500" />
            <h3 className="text-sm font-bold text-gray-800">Q&amp;A</h3>
            <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {questions.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
          {questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ChatTeardropText size={32} className="text-gray-200 mb-2" weight="bold" />
              <p className="text-sm text-gray-400 font-medium">
                Jadilah yang pertama bertanya!
              </p>
            </div>
          ) : (
            questions.map((q) => {
              const isLiked = q.likedByIds.includes(myUserId)
              const isOwn = q.authorId === myUserId
              return (
                <div
                  key={q.id}
                  className="flex flex-col gap-1.5 p-3 rounded-xl border border-gray-100 bg-gray-50"
                >
                  <p className="text-sm text-gray-700 leading-snug">{q.text}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-gray-400 font-medium">{q.authorName}</p>
                    {!isOwn && (
                      <button
                        onClick={() => handleToggleLike(q)}
                        className={`flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                          isLiked
                            ? 'text-red-500'
                            : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        <Heart
                          size={13}
                          weight={isLiked ? 'fill' : 'regular'}
                        />
                        {q.likeCount}
                      </button>
                    )}
                    {isOwn && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-300">
                        <Heart size={13} weight="fill" />
                        {q.likeCount}
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-3 border-t border-gray-100 shrink-0 flex flex-col gap-2">
          <AnimatePresence>
            {submitSuccess && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-emerald-600 font-semibold text-center"
              >
                Pertanyaan terkirim!
              </motion.p>
            )}
            {submitError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-red-500 font-semibold text-center"
              >
                {submitError}
              </motion.p>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 pb-1">
                  <div className="relative">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Tulis pertanyaanmu..."
                      rows={3}
                      autoFocus
                      className="w-full text-sm border-2 border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-primary-500 resize-none pr-10"
                    />
                    <span
                      className={`absolute bottom-3 right-3 text-[10px] font-semibold ${
                        isOverLimit ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      {remaining}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowForm(false); setText('') }}
                      className="flex-1 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!text.trim() || isOverLimit}
                      className="flex-1 py-2 text-xs font-bold text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <PaperPlaneTilt size={13} weight="bold" />
                      Kirim
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-2.5 text-xs font-bold text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors cursor-pointer"
            >
              Ask New Question
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
