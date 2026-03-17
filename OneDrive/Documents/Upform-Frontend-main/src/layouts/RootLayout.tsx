import type { ReactNode } from 'react'

type RootLayoutProps = {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <main>{children}</main>
    </div>
  )
}
