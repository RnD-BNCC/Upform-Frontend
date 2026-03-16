import type { Route } from '@/types/route'
import HomePage from '@/pages/home'
import LoginPage from '@/pages/login'
import EventDetailPage from '@/pages/events/detail'
import EventPreviewPage from '@/pages/events/preview'

export const publicRoutes: Route[] = [
  {
    key: 'home',
    title: 'Home',
    path: '/',
    component: HomePage,
    isEnabled: true,
    noLayout: true,
  },
  {
    key: 'login',
    title: 'Login',
    path: '/login',
    component: LoginPage,
    isEnabled: true,
    noLayout: true,
  },
  {
    key: 'event-detail',
    title: 'Form Builder',
    path: '/events/:id',
    component: EventDetailPage,
    isEnabled: true,
    noLayout: true,
  },
  {
    key: 'event-preview',
    title: 'Form Preview',
    path: '/events/:id/preview',
    component: EventPreviewPage,
    isEnabled: true,
    noLayout: true,
  },
]
