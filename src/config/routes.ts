import type { Route } from '@/types/route'
import HomePage from '@/pages/HomePage'

export const publicRoutes: Route[] = [
  {
    key: 'home',
    title: 'Home',
    path: '/',
    component: HomePage,
    isEnabled: true,
  },
]
