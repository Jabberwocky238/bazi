import { useCallback, useEffect, useState } from 'react'

// ————————————————————————————————————————————————————————
// useTheme —— 三态主题: 'light' | 'dark' | 'system'。
//
// 持久化到 localStorage('bazi:theme'); 'system' 跟随 prefers-color-scheme,
// 并监听系统主题变化实时切换。实际生效靠给 <html> 加/去 .dark class
// (index.css 里 @custom-variant dark 已绑到 .dark)。
//
// 为避免首屏闪烁 (FOUC), index.html 内联了一段同步初始化脚本 (见 useThemeInit),
// 在 React 挂载前就设好 .dark; 此 hook 启动后接管同一份 localStorage。
// ————————————————————————————————————————————————————————

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'bazi:theme'

function readStored(): ThemeMode {
  if (typeof window === 'undefined') return 'system'
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false
}

/** 当前 mode 是否应呈现暗色。 */
export function isDarkActive(mode: ThemeMode): boolean {
  return mode === 'dark' || (mode === 'system' && systemPrefersDark())
}

function applyDark(dark: boolean) {
  const el = document.documentElement
  el.classList.toggle('dark', dark)
  el.style.colorScheme = dark ? 'dark' : 'light'
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(readStored)

  // mode 或系统偏好变化时, 同步 <html>.dark
  useEffect(() => {
    applyDark(isDarkActive(mode))
  }, [mode])

  // system 模式下监听系统主题变化
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [mode])

  const change = useCallback((m: ThemeMode) => {
    setMode(m)
    try { localStorage.setItem(STORAGE_KEY, m) } catch { /* ignore */ }
  }, [])

  /** 三态循环切换: light → dark → system → light。 */
  const cycle = useCallback(() => {
    const order: ThemeMode[] = ['light', 'dark', 'system']
    const next = order[(order.indexOf(mode) + 1) % order.length]
    change(next)
  }, [mode, change])

  return { mode, change, cycle, isDark: isDarkActive(mode) }
}
