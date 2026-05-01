import type { Route } from '@/types/route'
import HomePage from '@/pages/home'
import GalleryPage from '@/pages/gallery'
import LoginPage from '@/pages/login'
import EventDetailPage from '@/pages/events/detail'
import EventPreviewPage from '@/pages/events/preview'
import PublicFormPage from '@/pages/forms'
import PollsPage from '@/pages/polls'
import PollEditPage from '@/pages/polls/edit'
import PollPresentPage from '@/pages/polls/present'
import LiveJoinPage from '@/pages/live'
import LiveVotePage from '@/pages/live/vote'
import NotFoundPage from '@/pages/not-found'

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
  {
    key: 'gallery',
    title: 'Gallery',
    path: '/gallery',
    component: GalleryPage,
    isEnabled: true,
    noLayout: true,
  },
  {
    key: 'polls',
    title: 'Polls',
    path: '/polls',
    component: PollsPage,
    isEnabled: true,
    noLayout: true,
  },
  {
    key: 'poll-editor',
    title: 'Poll Editor',
    path: '/polls/:id/edit',
    component: PollEditPage,
    isEnabled: true,
    noLayout: true,
  },
  {
    key: 'poll-present',
    title: 'Present',
    path: '/polls/:id/present',
    component: PollPresentPage,
    isEnabled: true,
    noLayout: true,
  },
  {
    key: 'live-join',
    title: 'Join Poll',
    path: '/live',
    component: LiveJoinPage,
    isEnabled: true,
    noLayout: true,
    isUnguarded: true,
  },
  {
    key: 'live-vote',
    title: 'Live Poll',
    path: '/live/:code',
    component: LiveVotePage,
    isEnabled: true,
    noLayout: true,
    isUnguarded: true,
  },
  {
    key: 'not-found',
    title: 'Not Found',
    path: '*',
    component: NotFoundPage,
    isEnabled: true,
    noLayout: true,
    isUnguarded: true,
  },
]
