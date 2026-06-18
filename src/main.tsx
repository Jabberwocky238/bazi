import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './index.css'

import Index from './pages/Index'
import BaziInput from './pages/BaziInput'
import BaziShow from './pages/BaziShow'
import HepanInput from './pages/HepanInput'
import HepanShow from './pages/HepanShow'
import { DialogProvider } from '@@/DialogContext'

createRoot(document.getElementById('root')!).render(
  <DialogProvider>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/bazi-input" element={<BaziInput />} />
          <Route path="/bazi-show" element={<BaziShow />} />
          <Route path="/hepan-input" element={<HepanInput />} />
          <Route path="/hepan-show" element={<HepanShow />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </DialogProvider>,
)
