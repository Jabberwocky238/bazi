import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { GenericLayout } from '@@/GenericLayout'
import { DialogProvider } from '@@/Dialog'
import { Suspense } from 'react'
import BaziInput from './BaziInput'
import BaziShow from './BaziShow'
import HepanInput from './HepanInput'
import HepanShow from './HepanShow'

function Index() {
  return (
    <GenericLayout errorBoundaryName="Index" title="八字补完计划" description="选择功能，开始排盘 / 合盘">
      <div className="space-y-4 py-8">
        <Link
          to="/bazi-input"
          className="block w-full text-center px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <div className="text-lg font-medium">八字排盘</div>
          <div className="text-sm text-slate-500">输入出生时间，查看八字命盘</div>
        </Link>

        <Link
          to="/hepan-input"
          className="block w-full text-center px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          <div className="text-lg font-medium">八字合盘</div>
          <div className="text-sm text-slate-500">对比两人八字，查看合盘分析</div>
        </Link>
      </div>
    </GenericLayout>
  )
}

export default function App() {
  return  <DialogProvider>
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
  </DialogProvider>
}