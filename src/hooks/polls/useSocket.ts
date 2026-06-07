import { useEffect, useRef, useState } from 'react'
import {
  disconnectSocket,
  getSocket,
  joinPollGroup,
  leavePollGroup,
  negotiatePoll,
} from '@/lib'
import type { Socket } from 'socket.io-client'
import type { PollSocketError } from '@/types/pollSocket'

type PollSocketStatus = 'connected' | 'connecting' | 'error' | 'idle' | 'joined'

export function useSocket(pollId: string | undefined) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [status, setStatus] = useState<PollSocketStatus>('idle')
  const [error, setError] = useState<PollSocketError | null>(null)

  useEffect(() => {
    if (!pollId) return

    const socket = getSocket()
    socketRef.current = socket

    const handleConnect = () => {
      setConnected(true)
      setStatus('connected')
      setError(null)
    }
    const handleDisconnect = () => {
      setConnected(false)
      setStatus('idle')
    }
    const handlePollError = (nextError: PollSocketError) => {
      setError(nextError)
      setStatus('error')
    }

    if (!socket.connected) socket.connect()
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('poll:error', handlePollError)
    if (socket.connected) handleConnect()

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('poll:error', handlePollError)
      leavePollGroup(socket, pollId)
      setConnected(false)
      setStatus('idle')
      disconnectSocket()
    }
  }, [pollId])

  useEffect(() => {
    if (!connected || !pollId) return

    let isActive = true
    const activePollId = pollId

    async function joinSession() {
      const socket = socketRef.current
      if (!socket) return

      const negotiation = await negotiatePoll(socket, activePollId)
      if (!isActive) return
      if (!negotiation.ok) {
        setError(negotiation.error)
        setStatus('error')
        return
      }

      const join = await joinPollGroup(socket, activePollId)
      if (!isActive) return
      if (!join.ok) {
        setError(join.error)
        setStatus('error')
        return
      }

      setError(null)
      setStatus('joined')
    }

    void joinSession()

    return () => {
      isActive = false
    }
  }, [connected, pollId])

  return { socketRef, connected, error, status }
}
