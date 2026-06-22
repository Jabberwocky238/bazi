import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from '@@/layout'
import { Suspense } from 'react'
import BaziInput from './BaziInput'
import BaziShow from './BaziShow'
import HepanInput from './HepanInput'
import HepanShow from './HepanShow'

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <AppShell>
          <Routes>
            <Route path="/" element={<BaziInput />} />
            <Route path="/bazi-show" element={<BaziShow />} />
            <Route path="/hepan-input" element={<HepanInput />} />
            <Route path="/hepan-show" element={<HepanShow />} />
          </Routes>
        </AppShell>
      </Suspense>
    </BrowserRouter>
  )
}
