import { useEffect, useCallback, useRef } from 'react'
import type { RefObject } from 'react'
import type { Socket } from 'socket.io-client'
import type { QAQuestion } from '@/types/polling'

interface UseQASocketOptions {
  socketRef: RefObject<Socket | null>
  pollId: string | undefined
  myUserId: string
  questions: QAQuestion[]
  onQuestionsChange: (updater: (prev: QAQuestion[]) => QAQuestion[]) => void
}

export function useQASocket({
  socketRef,
  pollId,
  myUserId,
  onQuestionsChange,
}: UseQASocketOptions) {
  const pendingLikeTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !pollId) return

    const handleQuestionNew = (question: QAQuestion) => {
      onQuestionsChange((prev) => {
        const exists = prev.some((q) => q.id === question.id)
        if (exists) return prev
        return [...prev, { ...question, likedByIds: question.likedByIds ?? [] }]
      })
    }

    const handleLikeUpdated = (data: { questionId: string; likeCount: number; likedByIds: string[] }) => {
      onQuestionsChange((prev) =>
        prev.map((q) =>
          q.id === data.questionId
            ? { ...q, likeCount: data.likeCount, likedByIds: data.likedByIds }
            : q,
        ),
      )
      const timeout = pendingLikeTimeouts.current.get(data.questionId)
      if (timeout) {
        clearTimeout(timeout)
        pendingLikeTimeouts.current.delete(data.questionId)
      }
    }

    const handleResetScores = () => {
      onQuestionsChange(() => [])
    }

    socket.on('question:new', handleQuestionNew)
    socket.on('question:like_updated', handleLikeUpdated)
    socket.on('reset-scores', handleResetScores)

    return () => {
      socket.off('question:new', handleQuestionNew)
      socket.off('question:like_updated', handleLikeUpdated)
      socket.off('reset-scores', handleResetScores)
    }
  }, [socketRef.current, pollId])

  const submitQuestion = useCallback(
    (text: string, authorName: string, authorId: string) => {
      if (!socketRef.current || !pollId) return
      socketRef.current.emit('question:submit', { pollId, text, authorName, authorId })
    },
    [pollId],
  )

  const toggleLike = useCallback(
    (questionId: string, currentlyLiked: boolean, onRollback: () => void) => {
      if (!socketRef.current || !pollId) return

      const timeoutId = setTimeout(() => {
        onRollback()
        pendingLikeTimeouts.current.delete(questionId)
      }, 5000)

      pendingLikeTimeouts.current.set(questionId, timeoutId)

      socketRef.current.emit('question:like', {
        pollId,
        questionId,
        userId: myUserId,
        like: !currentlyLiked,
      })
    },
    [pollId, myUserId],
  )

  return { submitQuestion, toggleLike }
}
