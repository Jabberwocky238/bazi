import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './pages/main/App'

const HepanApp = lazy(() => import('./pages/hepan/HepanApp'))

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/hepan" element={<HepanApp />} />
      </Routes>
    </Suspense>
  </BrowserRouter>,
)
