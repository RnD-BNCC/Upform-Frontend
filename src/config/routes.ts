import type { Route } from '@/types/route'
import HomePage from '@/pages/home'
import LoginPage from '@/pages/login'

export const publicRoutes: Route[] = [
  {
    key: 'home',
    title: 'Home',
    path: '/',
    component: HomePage,
    isEnabled: true,
  },
  {
    key: 'login',
    title: 'Login',
    path: '/login',
    component: LoginPage,
    isEnabled: true,
    noLayout: true,
  },
]
