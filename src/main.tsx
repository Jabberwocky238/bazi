import { Suspense, lazy } from 'react'
import { ViteReactSSG } from 'vite-react-ssg'
import type { RouteRecord } from 'vite-react-ssg'
import './index.css'
import App from './pages/main/App'

const HepanApp = lazy(() => import('./pages/hepan/HepanApp'))

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: App,
    entry: 'src/pages/main/App.tsx',
  },
  {
    path: '/hepan',
    element: (
      <Suspense fallback={null}>
        <HepanApp />
      </Suspense>
    ),
    entry: 'src/pages/hepan/HepanApp.tsx',
  },
]

export const createRoot = ViteReactSSG({ routes })
