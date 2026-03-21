import { useEffect, useState } from 'react'
import type { MutableRefObject } from 'react'
import type { Socket } from 'socket.io-client'
import type { SlideResults } from '@/types/polling'

export function useLiveResults(
  socketRef: MutableRefObject<Socket | null>,
  slideId: string | undefined,
  connected?: boolean,
) {
  const [results, setResults] = useState<SlideResults | null>(null)

  useEffect(() => {
    setResults(null)

    const socket = socketRef.current
    if (!socket || !slideId) return

    const handler = (data: { slideId: string; results: SlideResults }) => {
      if (data.slideId === slideId) {
        setResults(data.results)
      }
    }

    socket.on('vote-update', handler)
    return () => {
      socket.off('vote-update', handler)
    }
  }, [socketRef, slideId, connected])

  return { results, setResults }
}
