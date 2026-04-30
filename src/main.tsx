import { lazy, Suspense, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

/**
 * 路由: react-router-dom BrowserRouter.
 *  - /        主盘 (同步 import, 零延迟与改动前完全一致)
 *  - /hepan*  合盘 (lazy import, 独立 chunk)
 *
 *  Cloudflare 静态托管不再需要 _redirects — react-router 在客户端处理 /hepan,
 *  Cloudflare 默认对 SPA 不存在的路径返回 index.html (Pages 默认 / Workers 加 not_found_handling).
 */
const HepanApp = lazy(() => import('./hepan/HepanApp'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/hepan/*"
          element={
            <Suspense fallback={null}>
              <HepanApp />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
