import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks'

export default function GuestGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useAuth()

  if (isPending) return children
  if (session) return <Navigate to="/" replace />

  return children
}
