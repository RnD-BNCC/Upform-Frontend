import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { publicRoutes } from '@/config/routes'
import type { Route as RouteConfig } from '@/types/route'
import RootLayout from '@/layouts/RootLayout'

function renderRoutes(routes: RouteConfig[]) {
  return routes
    .filter((route) => route.isEnabled && route.path)
    .map((route) => {
      const Component = route.component

      const element = route.noLayout ? (
        <Component />
      ) : (
        <RootLayout>
          <Component />
        </RootLayout>
      )

      return (
        <Route key={route.key} path={route.path} element={element}>
          {route.children && renderRoutes(route.children)}
        </Route>
      )
    })
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>{renderRoutes(publicRoutes)}</Routes>
    </BrowserRouter>
  )
}
