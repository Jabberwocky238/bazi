import { useState, type ReactNode } from 'react'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { Footer } from '@@/Footer'
import { formatBuildTime } from '@@/buildTime'
import { DisclaimerDialog } from '@@/DisclaimerDialog'

// ————————————————————————————————————————————————————————
// AppBar (头部) — 被 GenericLayout 内联使用
// ————————————————————————————————————————————————————————

interface AppBarProps {
  /** 大字标题。 */
  title: string
  /** 标题旁的次级链接 (返回 / 跳转), 可选。 */
  link?: ReactNode
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

function AppBar({ title, link, onDisclaimer }: AppBarProps) {
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
      </div>
      {/* 构建信息常驻左侧, 免责声明常驻右侧 */}
      <div className="mt-1 flex items-baseline justify-between gap-3 w-full text-[11px] md:text-xs text-slate-400 dark:text-slate-600">
        <span className="tabular-nums">版本为 {build.display} · {build.label}</span>
        <DisclaimerButton onClick={onDisclaimer} />
      </div>
    </header>
  )
}

// ————————————————————————————————————————————————————————
// GenericLayout — 八字排盘 / 合盘分析 共用页面外壳
// (ErrorBoundary > main > AppBar + children + Footer)
// ————————————————————————————————————————————————————————

interface GenericLayoutProps {
  /** 顶层 ErrorBoundary 名称, 区分日志归属。 */
  errorBoundaryName: string
  /** 大字标题。 */
  title: string
  /** 标题旁的次级链接 (返回 / 跳转), 可选。 */
  link?: ReactNode
  children: ReactNode
}

export function GenericLayout({
  errorBoundaryName,
  title,
  link,
  children,
}: GenericLayoutProps) {
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

  return (
    <ErrorBoundary name={errorBoundaryName}>
      <main className="mx-auto max-w-7xl px-3 md:px-6 pt-5 md:pt-10 pb-10 md:pb-16">
        <AppBar
          title={title}
          link={link}
          onDisclaimer={() => setDisclaimerOpen(true)}
        />
        {children}
        <ErrorBoundary name="Footer"><Footer /></ErrorBoundary>
      </main>
      <DisclaimerDialog open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />
    </ErrorBoundary>
  )
}
