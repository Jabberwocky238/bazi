import { Suspense, lazy } from 'react'
import { ViteReactSSG } from 'vite-react-ssg'
import type { RouteRecord } from 'vite-react-ssg'
import './index.css'
import App from './App.tsx'

const HepanApp = lazy(() => import('./hepan/HepanApp'))

export const routes: RouteRecord[] = [
  {
    path: '/',
    Component: App,
    entry: 'src/App.tsx',
  },
  {
    path: '/hepan',
    element: (
      <Suspense fallback={null}>
        <HepanApp />
      </Suspense>
    ),
    entry: 'src/hepan/HepanApp.tsx',
  },
]

export const createRoot = ViteReactSSG({ routes })
