import { createContext, useContext, useState, type ReactNode } from 'react'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { Footer } from '@@/Footer'
import { formatBuildTime } from '@@/buildTime'
import { DisclaimerDialog } from '@@/DisclaimerDialog'

// ————————————————————————————————————————————————————————
// GenericContext —— 让任意子组件读写 AppBar 的 description 内容
// ————————————————————————————————————————————————————————

interface GenericContextValue {
  description: ReactNode
  setDescription: (d: ReactNode) => void
}

const GenericContext = createContext<GenericContextValue | null>(null)

/** 读取 / 修改当前页 AppBar 的 description。须在 GenericLayout 内使用。 */
export function useGenericContext(): GenericContextValue {
  const ctx = useContext(GenericContext)
  if (!ctx) throw new Error('useGenericContext must be used within GenericLayout')
  return ctx
}

// ————————————————————————————————————————————————————————
// AppBar (头部) — 被 GenericLayout 内联使用
// ————————————————————————————————————————————————————————

interface AppBarProps {
  /** 大字标题。 */
  title: string
  /** 标题旁的次级链接 (返回 / 跳转), 可选。 */
  link?: ReactNode
  /** 副标题左侧描述。 */
  description: ReactNode
  /** 打开免责声明。 */
  onDisclaimer: () => void
}

function DisclaimerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 text-[10px] md:text-[11px] text-slate-400 dark:text-slate-600 hover:text-amber-700 dark:hover:text-amber-400 underline decoration-dotted underline-offset-2"
    >
      免责声明
    </button>
  )
}

function AppBar({ title, link, description, onDisclaimer }: AppBarProps) {
  const build = formatBuildTime(__APP_BUILD_TIME__)
  return (
    <header className="mb-5 md:mb-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {link && (
          <span className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline decoration-dotted">
            {link}
          </span>
        )}
        <span className="text-[11px] md:text-xs text-slate-400 dark:text-slate-600 tabular-nums ml-auto">
          版本为 {build.display} · {build.label}
        </span>
      </div>
      {/* 免责声明常驻右侧, description 由 GenericContext 提供, 所有页面均显示 */}
      <div className="mt-1 flex items-baseline justify-between gap-3 w-full text-xs md:text-sm text-slate-500 dark:text-slate-400">
        <span>{description}</span>
        <DisclaimerButton onClick={onDisclaimer} />
      </div>
    </header>
  )
}

// ————————————————————————————————————————————————————————
// GenericLayout — 八字排盘 / 合盘分析 共用页面外壳
// (ErrorBoundary > GenericContext.Provider > main > AppBar + children + Footer)
// ————————————————————————————————————————————————————————

interface GenericLayoutProps {
  /** 顶层 ErrorBoundary 名称, 区分日志归属。 */
  errorBoundaryName: string
  /** 大字标题。 */
  title: string
  /** 标题旁的次级链接 (返回 / 跳转), 可选。 */
  link?: ReactNode
  /** 初始 description; 运行时可用 useGenericContext().setDescription 修改。 */
  description?: ReactNode
  children: ReactNode
}

export function GenericLayout({
  errorBoundaryName,
  title,
  link,
  description,
  children,
}: GenericLayoutProps) {
  const [desc, setDescription] = useState<ReactNode>(description)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

  return (
    <ErrorBoundary name={errorBoundaryName}>
      <GenericContext.Provider value={{ description: desc, setDescription }}>
        <main className="mx-auto max-w-7xl px-3 md:px-6 pt-5 md:pt-10 pb-10 md:pb-16">
          <AppBar
            title={title}
            link={link}
            description={desc}
            onDisclaimer={() => setDisclaimerOpen(true)}
          />
          {children}
          <ErrorBoundary name="Footer"><Footer /></ErrorBoundary>
        </main>
        <DisclaimerDialog open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
      </GenericContext.Provider>
    </ErrorBoundary>
  )
}
