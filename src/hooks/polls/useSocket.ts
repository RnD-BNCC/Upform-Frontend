import { useEffect, useRef, useState } from 'react'
import { getSocket, disconnectSocket } from '@/lib'
import type { Socket } from 'socket.io-client'

export function useSocket(pollId: string | undefined) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!pollId) return

    const socket = getSocket()
    socketRef.current = socket

    const handleConnect = () => setConnected(true)

    if (!socket.connected) socket.connect()
    socket.on('connect', handleConnect)
    if (socket.connected) handleConnect()

    return () => {
      socket.off('connect', handleConnect)
      socket.emit('leave-poll', pollId)
      setConnected(false)
      disconnectSocket()
    }
  }, [pollId])

  useEffect(() => {
    if (!connected || !pollId) return
    socketRef.current?.emit('join-poll', pollId)
  }, [connected, pollId])

  return { socketRef, connected }
}
