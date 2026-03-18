import { Route } from 'react-router-dom'
import type { Route as RouteConfig } from '@/types/route'
import RootLayout from '@/layouts/RootLayout'
import AuthGuard from '@/components/auth/AuthGuard'
import GuestGuard from '@/components/auth/GuestGuard'

export function renderRoutes(routes: RouteConfig[]) {
  return routes
    .filter((route) => route.isEnabled && route.path)
    .map((route) => {
      const Component = route.component

      const page = route.noLayout ? (
        <Component />
      ) : (
        <RootLayout>
          <Component />
        </RootLayout>
      )

      const element = route.isPublic ? (
        <GuestGuard>{page}</GuestGuard>
      ) : (
        <AuthGuard>{page}</AuthGuard>
      )

      return (
        <Route key={route.key} path={route.path} element={element}>
          {route.children && renderRoutes(route.children)}
        </Route>
      )
    })
}
