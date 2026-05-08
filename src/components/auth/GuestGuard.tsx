import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks'

export default function GuestGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useAuth()
  const location = useLocation()

  if (isPending) return children
  if (session) {
    const redirect = new URLSearchParams(location.search).get('redirect')
    const safeRedirect =
      redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/'
    return <Navigate to={safeRedirect} replace />
  }

  return children
}
