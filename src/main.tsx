import { createRoot } from 'react-dom/client'
import { initNative } from '@/native'
import './index.css'

import App from './pages/Index'
import { StrictMode } from 'react'

// 原生壳表现层初始化 (Capacitor iOS/Android 与 Tauri 桌面统一入口):
// 打 <html>.native (联动 index.css 的 native: 修饰符做 safe-area 避让 + 禁拖拽/误选) +
// Capacitor 下额外 viewport-fit=cover (否则 env(safe-area-inset-*) 恒为 0)。
// 网页端 (非原生) 与 SSG (node 预渲染) 内部均有 guard, 零副作用。
initNative()

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
