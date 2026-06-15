import type { ReactNode } from 'react'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { Footer } from '@@/Footer'
import { formatBuildTime } from '@@/buildTime'

// ————————————————————————————————————————————————————————
// AppBar (头部) — 被 GenericLayout 内联使用
// ————————————————————————————————————————————————————————

interface AppBarProps {
  /** 大字标题。 */
  title: string
  /** 标题旁的次级链接 (返回 / 跳转), 可选。 */
  link?: { href: string; text: string }
  /** 副标题左侧描述。 */
  description?: ReactNode
  /** 副标题右侧自定义槽 (例如免责声明按钮)。 */
  descriptionRight?: ReactNode
}

function AppBar({ title, link, description, descriptionRight }: AppBarProps) {
  const build = formatBuildTime(__APP_BUILD_TIME__)
  const hasDescRow = description !== undefined || descriptionRight !== undefined
  return (
    <header className="mb-5 md:mb-6">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{title}</h1>
        {link && (
          <a
            href={link.href}
            className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline decoration-dotted"
          >
            {link.text}
          </a>
        )}
        <span className="text-[11px] md:text-xs text-slate-400 dark:text-slate-600 tabular-nums ml-auto">
          版本为 {build.display} · {build.label}
        </span>
      </div>
      {hasDescRow && (
        <div className="mt-1 flex items-baseline justify-between gap-3 w-full text-xs md:text-sm text-slate-500 dark:text-slate-400">
          <span>{description}</span>
          {descriptionRight}
        </div>
      )}
    </header>
  )
}

// ————————————————————————————————————————————————————————
// GenericLayout — 八字排盘 / 合盘分析 共用页面外壳
// (ErrorBoundary > main > AppBar + children + Footer)
// ————————————————————————————————————————————————————————

interface GenericLayoutProps extends AppBarProps {
  /** 顶层 ErrorBoundary 名称, 区分日志归属。 */
  errorBoundaryName: string
  children: ReactNode
}

export function GenericLayout({
  errorBoundaryName,
  title,
  link,
  description,
  descriptionRight,
  children,
}: GenericLayoutProps) {
  return (
    <ErrorBoundary name={errorBoundaryName}>
      <main className="mx-auto max-w-7xl px-3 md:px-6 pt-5 md:pt-10 pb-10 md:pb-16">
        <AppBar
          title={title}
          link={link}
          description={description}
          descriptionRight={descriptionRight}
        />
        {children}
        <ErrorBoundary name="Footer"><Footer /></ErrorBoundary>
      </main>
    </ErrorBoundary>
  )
}
