import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import LoadingScreen from '@/components/ui/LoadingScreen'

const REDIRECT_DELAY = 2000

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useAuth()
  const [redirecting, setRedirecting] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isPending) return

    if (!session) {
      setRedirecting(true)
      const timer = setTimeout(() => setReady(true), REDIRECT_DELAY)
      return () => clearTimeout(timer)
    }
  }, [isPending, session])

  if (isPending) return null
  if (redirecting && !ready) return <LoadingScreen />
  if (redirecting && ready) return <Navigate to="/login" replace />

  return children
}
