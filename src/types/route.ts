import type { ComponentType } from 'react'

export type Route = {
  key: string
  title: string
  description?: string
  path?: string
  component: ComponentType
  isEnabled: boolean
  noLayout?: boolean
  isPublic?: boolean
  children?: Route[]
}
