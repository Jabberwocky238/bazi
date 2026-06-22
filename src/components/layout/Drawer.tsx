import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { type ReactNode } from 'react'
import { useLayout } from './context'
import { useDrawerSwipe } from './useDrawerSwipe'
import { FooterSources } from '@@/Footer'
import { ThemeToggle } from './BottomBar'

// ————————————————————————————————————————————————————————
// Drawer —— 最外层布局容器, 内含 AppBar + main (由 children 传入)。
//
// 两种形态 (同一组件按视口切换, 互斥于响应式 class):
//
//   桌面 (md+):  [SidebarPanel][content-column]
//                左侧 SidebarPanel 挤占宽度 (展开 w-72 / 折叠 w-0),
//                右侧 content-column = AppBar(sticky) + main。
//   移动:        content-column 全宽 (AppBar + main), 抽屉收起;
//                展开时 MobileOverlay 全屏覆盖, 右上角 ✕ 关闭。
//
// 桌面 / 移动两套状态独立 (desktopOpen 默认开 / mobileOpen 默认关),
// 记录在 LayoutContext。content-column 始终渲染, 抽屉只是其外的导航层。
// ————————————————————————————————————————————————————————

interface NavItem {
  to: string
  label: string
  desc: string
  /** 激活判定: 该项所属区段前缀。 */
  section: 'home' | 'hepan'
}

const NAV: NavItem[] = [
  { to: '/', label: '八字排盘', desc: '输入出生时间，查看八字命盘', section: 'home' },
  { to: '/hepan-input', label: '八字合盘', desc: '对比两人八字，查看合盘分析', section: 'hepan' },
]

function activeSection(pathname: string): NavItem['section'] | null {
  if (pathname === '/' || pathname.startsWith('/bazi')) return 'home'
  if (pathname.startsWith('/hepan')) return 'hepan'
  return null
}

/** 共享导航列表 —— 桌面侧栏 / 移动覆盖层复用。 */
function NavList({
  pathname,
  onNavigate,
  onDisclaimer,
}: {
  pathname: string
  /** 点击导航项后回调 (移动端用来关抽屉)。 */
  onNavigate?: () => void
  onDisclaimer: () => void
}) {
  const active = activeSection(pathname)
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <nav className="p-3 space-y-1">
        {NAV.map((item) => {
          const isActive = active === item.section
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`block px-3 py-2.5 rounded-xl transition ${isActive ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
            >
              <div className="text-sm font-medium">{item.label}</div>
              <div className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{item.desc}</div>
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto p-3 border-t border-slate-200 dark:border-slate-800">
        {/* 来源信息 —— 释义/计算/项目仓库, 从页脚移入抽屉 */}
        <FooterSources />
        <div className="space-y-1">
          {/* 主题切换 —— 三态循环 (亮/暗/跟随系统), 跟随抽屉显示 */}
          <ThemeToggle />
          <button
            type="button"
            onClick={onDisclaimer}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            免责声明
          </button>
        </div>
      </div>
    </div>
  )
}

interface DrawerProps {
  children: ReactNode
  pathname: string
}

/** 最外层: 桌面 [侧栏][内容列], 移动 [内容列] + 覆盖层。 */
export function Drawer({ children, pathname }: DrawerProps) {
  return (
    <div className="md:flex">
      <SidebarPanel pathname={pathname} />
      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        {children}
      </div>
      <MobileOverlay pathname={pathname} />
    </div>
  )
}

// ————————————————————————————————————————————————————————
// 桌面侧栏 (drawer 内容): 常驻左侧, 挤占内容列宽度。
// 展开 w-72 / 折叠 w-0, 内层固定 w-72 防重排, 宽度过渡动画。
// hidden md:flex —— 移动端永不渲染。
// ————————————————————————————————————————————————————————

function SidebarPanel({ pathname }: { pathname: string }) {
  const { desktopOpen, openDisclaimer } = useLayout()
  return (
    <aside
      className={`hidden md:flex shrink-0 flex-col sticky top-0 h-screen overflow-hidden border-r border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 transition-[width] duration-300 ease-out native:pt-[env(safe-area-inset-top)] ${desktopOpen ? 'w-72' : 'w-0'}`}
    >
      <div className="w-72 h-full flex flex-col">
        <div className="h-14 shrink-0 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <span className="text-base font-semibold">导航</span>
        </div>
        <NavList pathname={pathname} onDisclaimer={openDisclaimer} />
      </div>
    </aside>
  )
}

// ————————————————————————————————————————————————————————
// 移动覆盖层 (drawer 内容): 全宽 (100%) 覆盖, 默认收起。
// portal 到 body, 右上角 ✕ 关闭, 背景遮罩点击关闭, Esc 关闭, 开时锁滚动。
// md:hidden —— 桌面端永不渲染 (即便 mobileOpen 为真)。
// ————————————————————————————————————————————————————————

function MobileOverlay({ pathname }: { pathname: string }) {
  const { mobileOpen, closeDrawer, openDrawer, openDisclaimer, isDesktop } = useLayout()

  // 左右滑动手势 (仅移动端)
  const { dragX, dragging, panelWidth } = useDrawerSwipe({
    open: mobileOpen,
    openDrawer,
    closeDrawer,
    enabled: !isDesktop,
  })

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [mobileOpen, closeDrawer])

  // 拖动时面板实时位移; 拖动结束 (dragX=null) 交回 CSS 过渡。
  // 遮罩透明度跟随面板露出比例 (0~1)。
  const panelX = dragX ?? (mobileOpen ? 0 : -panelWidth)
  const reveal = Math.max(0, Math.min(1, (panelX + panelWidth) / panelWidth))

  return createPortal(
    <div
      className={`md:hidden fixed inset-0 z-50 ${mobileOpen || dragging ? '' : 'pointer-events-none'}`}
      aria-hidden={!mobileOpen}
    >
      {/* 背景遮罩 —— 透明度跟随面板露出比例 */}
      <div
        onClick={closeDrawer}
        style={{ opacity: dragX !== null ? reveal : undefined }}
        className={`absolute inset-0 bg-slate-900/40 ${dragging ? '' : 'transition-opacity duration-300'} ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* 全宽面板 —— 拖动时禁用 transition 以实时跟手 */}
      <aside
        style={{ transform: dragX !== null ? `translateX(${panelX}px)` : undefined }}
        className={`absolute left-0 top-0 h-full w-full bg-white dark:bg-slate-900 shadow-xl border-r border-slate-200 dark:border-slate-800 ${dragging ? '' : 'transition-transform duration-300 ease-out'} native:pt-[env(safe-area-inset-top)] ${dragX === null ? (mobileOpen ? 'translate-x-0' : '-translate-x-full') : ''}`}
      >
        <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <span className="text-base font-semibold">导航</span>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="关闭菜单"
            className="text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 transition"
          >
            ✕
          </button>
        </div>
        <NavList
          pathname={pathname}
          onNavigate={closeDrawer}
          onDisclaimer={openDisclaimer}
        />
      </aside>
    </div>,
    document.body,
  )
}
