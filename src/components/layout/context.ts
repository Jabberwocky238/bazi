import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

// ————————————————————————————————————————————————————————
// LayoutContext —— 由 AppShell 提供, 暴露布局托管的命令式动作。
// 子组件用 useLayout() 调用, 无需 prop 透传。
// ————————————————————————————————————————————————————————

export interface LayoutContextValue {
  /** 桌面端侧栏是否展开 (默认展开)。 */
  desktopOpen: boolean
  /** 移动端抽屉是否展开 (默认收起)。 */
  mobileOpen: boolean
  /** 当前视口是否为桌面 (md+)。 */
  isDesktop: boolean
  /** 切换当前视口对应的抽屉。 */
  toggleDrawer: () => void
  /** 打开当前视口对应的抽屉。 */
  openDrawer: () => void
  /** 关闭当前视口对应的抽屉。 */
  closeDrawer: () => void
  /** 打开免责声明 (同时收起移动端抽屉)。 */
  openDisclaimer: () => void
}

export const LayoutContext = createContext<LayoutContextValue | null>(null)

/** 取布局上下文 —— 调用 toggleDrawer / openDisclaimer 等命令式动作。 */
export function useLayout(): LayoutContextValue {
  const ctx = useContext(LayoutContext)
  if (!ctx) throw new Error('useLayout must be used within <AppShell>')
  return ctx
}

/** 当前视口是否为桌面 (≥ md / 768px)。SSR 安全。 */
export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(min-width: 768px)').matches
      : true,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => setDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return desktop
}
