import { BrowserRouter, Routes } from 'react-router-dom'
import { publicRoutes } from '@/config/routes'
import { renderRoutes } from '@/middleware'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>{renderRoutes(publicRoutes)}</Routes>
    </BrowserRouter>
  )
}
