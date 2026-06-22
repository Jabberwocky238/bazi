import { useTheme, type ThemeMode } from './useTheme'

// ————————————————————————————————————————————————————————
// ThemeToggle —— 三态主题切换按钮 (亮/暗/跟随系统)。
// 放在抽屉 (桌面侧栏 / 移动覆盖层) 内底部, 跟随抽屉显示与隐藏。
// 点击循环: light → dark → system → light。
// ————————————————————————————————————————————————————————

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

const LABEL: Record<ThemeMode, string> = {
  light: '亮色',
  dark: '暗色',
  system: '跟随系统',
}

function ThemeIcon({ mode }: { mode: ThemeMode }) {
  if (mode === 'dark') return <MoonIcon />
  if (mode === 'light') return <SunIcon />
  return <SystemIcon />
}

export function ThemeToggle() {
  const { mode, cycle } = useTheme()
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`切换主题 (当前: ${LABEL[mode]})`}
      title={`主题: ${LABEL[mode]}`}
      className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
    >
      <ThemeIcon mode={mode} />
      <span>主题 · {LABEL[mode]}</span>
    </button>
  )
}
