import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useAuth()

  if (isPending) return children
  if (!session) return <Navigate to="/login" replace />

  return children
}
