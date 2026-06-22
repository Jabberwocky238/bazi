import { formatBuildTime } from '@@/buildTime'
import { useChat } from '@@/stores'
import { useLayout } from './context'

// ————————————————————————————————————————————————————————
// AppBar —— 常驻顶部 sticky titlebar。
// 左侧抽屉按钮 + 应用标题，右侧聊天按钮 + 构建信息 + 免责声明。
// 半透明毛玻璃背景，浮于内容之上 (content 通过 pt 偏移避让)。
// 动作 (打开抽屉 / 聊天 / 免责声明) 通过 useLayout() / useChat() 调用。
// ————————————————————————————————————————————————————————

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M4 7h16M4 12h16M4 17h16"
      />
    </svg>
  )
}

function RobotIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="11" rx="2" />
      <path d="M12 8V4M9 2h6" />
      <circle cx="9" cy="13" r="1" />
      <circle cx="15" cy="13" r="1" />
      <path d="M2 13v2M22 13v2" />
    </svg>
  )
}

export function AppBar() {
  const { toggleDrawer, openDisclaimer, isDesktop, desktopOpen, mobileOpen } = useLayout()
  const { chatOpen, toggleChat } = useChat()
  const build = formatBuildTime(__APP_BUILD_TIME__)
  // 当前视口对应的抽屉是否展开 —— 决定按钮 aria 状态。
  const drawerOpen = isDesktop ? desktopOpen : mobileOpen
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 dark:border-slate-800/70 bg-[#fafaf7]/80 dark:bg-slate-950/80 backdrop-blur-md native:pt-[env(safe-area-inset-top)]">
      <div className="mx-auto max-w-7xl px-3 md:px-6 h-14 flex items-center gap-2.5">
        <button
          type="button"
          onClick={toggleDrawer}
          aria-label={drawerOpen ? '收起菜单' : '打开菜单'}
          aria-expanded={drawerOpen}
          className="shrink-0 -ml-1 p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
        >
          <MenuIcon />
        </button>
        <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">
          八字补完计划
        </h1>
        <div className="ml-auto flex items-center gap-3">
          {/* 聊天助手 —— 机器人图标, 与抽屉按钮呼应 */}
          <button
            type="button"
            onClick={toggleChat}
            aria-label={chatOpen ? '关闭聊天' : '打开聊天'}
            aria-expanded={chatOpen}
            className={`shrink-0 p-1.5 rounded-lg transition ${chatOpen ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'}`}
          >
            <RobotIcon />
          </button>
          <span className="hidden sm:inline text-[11px] tabular-nums text-slate-400 dark:text-slate-600">
            {build.display} · {build.label}
          </span>
          <button
            type="button"
            onClick={openDisclaimer}
            className="shrink-0 text-[10px] md:text-[11px] text-slate-400 dark:text-slate-600 hover:text-amber-700 dark:hover:text-amber-400 underline decoration-dotted underline-offset-2 transition"
          >
            免责声明
          </button>
        </div>
      </div>
    </header>
  )
}
