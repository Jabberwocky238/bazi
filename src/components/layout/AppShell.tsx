import { useCallback, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { Footer } from '@@/Footer'
import { DialogProvider, useDialog } from '@@/Dialog'
import { DisclaimerContent } from '@@/DisclaimerContent'
import { AppBar } from './AppBar'
import { Drawer } from './Drawer'
import { LayoutContext, type LayoutContextValue, useIsDesktop } from './context'

// ————————————————————————————————————————————————————————
// AppShell —— 全站常驻外壳, 自带所有"位置"层。
//
// 结构:  DialogProvider (浮层栈位置 —— 由 shell 自己挂载, 不再要求外部包裹)
//       └ AppShellInner
//           └ Drawer (最外层布局容器)
//               ├ SidebarPanel   (桌面: 常驻左侧, 挤占宽度 [侧栏][内容列])
//               ├ content-column = AppBar(sticky) + main
//               └ MobileOverlay  (移动: 全宽覆盖抽屉, 右上角 ✕ 关闭)
//
// 桌面 / 移动两套抽屉状态独立 (desktopOpen 默认开 / mobileOpen 默认关),
// 记录在 LayoutContext。toggleDrawer 按当前视口路由到对应一套。
// "dialog" 原语 (DialogProvider/useDialog) 是共享的, 留在 components/。
// 各页面级 ErrorBoundary 仍由各页面自行包裹。
// ————————————————————————————————————————————————————————

interface AppShellProps {
  children: ReactNode
}

/**
 * 外壳入口 —— 挂载浮层位置 (DialogProvider), 再渲染内部。
 * 之所以拆出 Inner: AppShell 自身要 useDialog() (开免责声明),
 * 而提供者必须是消费者的祖先, 故提供者在 AppShell、消费在 AppShellInner。
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <DialogProvider>
      <AppShellInner>{children}</AppShellInner>
    </DialogProvider>
  )
}

function AppShellInner({ children }: AppShellProps) {
  const isDesktop = useIsDesktop()
  // 桌面默认展开 / 移动默认收起, 两套状态独立。
  const [desktopOpen, setDesktopOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const dialog = useDialog()

  const toggleDrawer = useCallback(() => {
    if (isDesktop) setDesktopOpen((v) => !v)
    else setMobileOpen((v) => !v)
  }, [isDesktop])
  const openDrawer = useCallback(() => {
    if (isDesktop) setDesktopOpen(true)
    else setMobileOpen(true)
  }, [isDesktop])
  const closeDrawer = useCallback(() => {
    if (isDesktop) setDesktopOpen(false)
    else setMobileOpen(false)
  }, [isDesktop])
  const openDisclaimer = useCallback(() => {
    setMobileOpen(false)
    dialog.open(<DisclaimerContent />, { title: '免责声明' })
  }, [dialog])

  const value: LayoutContextValue = {
    desktopOpen,
    mobileOpen,
    isDesktop,
    toggleDrawer,
    openDrawer,
    closeDrawer,
    openDisclaimer,
  }

  return (
    <LayoutContext.Provider value={value}>
      <Drawer pathname={location.pathname}>
        <AppBar />
        <main className="mx-auto w-full max-w-7xl px-3 md:px-6 pb-10 md:pb-16">
          {children}
          <ErrorBoundary name="Footer"><Footer /></ErrorBoundary>
        </main>
      </Drawer>
    </LayoutContext.Provider>
  )
}
