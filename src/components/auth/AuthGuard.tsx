import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/hooks'

export default function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useAuth()

  if (isPending)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500" />
      </div>
    )
  if (!session) return <Navigate to="/login" replace />

  return children
}
