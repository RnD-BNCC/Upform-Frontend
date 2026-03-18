import type { Route } from '@/types/route'
import HomePage from '@/pages/home'
import LoginPage from '@/pages/login'
import EventDetailPage from '@/pages/events/detail'
import EventPreviewPage from '@/pages/events/preview'
import PublicFormPage from '@/pages/forms'

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
    isPublic: true,
  },
  {
    key: 'form-builder',
    title: 'Form Builder',
    path: '/forms/:id/edit',
    component: EventDetailPage,
    isEnabled: true,
    noLayout: true,
  },
  {
    key: 'form-preview',
    title: 'Form Preview',
    path: '/forms/:id/preview',
    component: EventPreviewPage,
    isEnabled: true,
    noLayout: true,
  },
  {
    key: 'public-form',
    title: 'Form',
    path: '/forms/:id',
    component: PublicFormPage,
    isEnabled: true,
    noLayout: true,
    isUnguarded: true,
  },
]
