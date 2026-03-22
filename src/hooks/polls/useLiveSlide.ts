import { useEffect, useState } from 'react'
import type { MutableRefObject } from 'react'
import type { Socket } from 'socket.io-client'
import type { PollStatus, Participant, LeaderboardEntry } from '@/types/polling'

export function useLiveSlide(socketRef: MutableRefObject<Socket | null>, connected: boolean) {
  const [currentSlide, setCurrentSlide] = useState<number | null>(null)
  const [pollStatus, setPollStatus] = useState<PollStatus | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [participantList, setParticipantList] = useState<Participant[]>([])
  const [countdown, setCountdown] = useState<number | null>(null)
  const [leaderboardScores, setLeaderboardScores] = useState<LeaderboardEntry[]>([])
  const [scoreUpdate, setScoreUpdate] = useState<{ participantId: string; points: number; isCorrect: boolean } | null>(null)

  useEffect(() => {
    const socket = socketRef.current
    if (!socket) return
    let goTimer: ReturnType<typeof setTimeout> | null = null

    const onSlideChange = (data: { currentSlide: number }) => {
      setCurrentSlide(data.currentSlide)
      setCountdown(null)
    }

    const onPollState = (data: { status: PollStatus }) => {
      setPollStatus(data.status)
      if (data.status === 'active') setCountdown(null)
    }

    const onParticipantCount = (count: number) => {
      setParticipantCount(count)
    }

    const onParticipantList = (list: Participant[]) => {
      setParticipantList(list)
    }

    const onCountdown = (data: { count: number }) => {
      setCountdown(data.count)
      if (data.count === 0) {
        goTimer = setTimeout(() => {
          setCountdown(null)
          setPollStatus('active')
        }, 1200)
      }
    }

    const onShowLeaderboard = (data: { scores: LeaderboardEntry[] }) => {
      setLeaderboardScores(data.scores)
    }

    const onScoreUpdate = (data: { participantId: string; points: number; isCorrect: boolean }) => {
      setScoreUpdate(data)
    }

    socket.on('slide-change', onSlideChange)
    socket.on('poll-state', onPollState)
    socket.on('participant-count', onParticipantCount)
    socket.on('participant-list', onParticipantList)
    socket.on('countdown', onCountdown)
    socket.on('show-leaderboard', onShowLeaderboard)
    socket.on('score-update', onScoreUpdate)

    return () => {
      if (goTimer) clearTimeout(goTimer)
      socket.off('slide-change', onSlideChange)
      socket.off('poll-state', onPollState)
      socket.off('participant-count', onParticipantCount)
      socket.off('participant-list', onParticipantList)
      socket.off('countdown', onCountdown)
      socket.off('show-leaderboard', onShowLeaderboard)
      socket.off('score-update', onScoreUpdate)
    }
  }, [socketRef, connected])

  return { currentSlide, pollStatus, participantCount, participantList, countdown, leaderboardScores, scoreUpdate }
}
