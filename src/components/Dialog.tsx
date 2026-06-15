import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ShellProps {
  title: string
  /** 标题上方一行小字 (eg. category 标签)。 */
  subtitle?: string
  /** 提供则显示右上角"关闭 ✕"。 */
  onClose?: () => void
  children: ReactNode
}

/** 共享 chrome —— header (subtitle + title + 可选关闭) + 滚动 body。 */
function Shell({ title, subtitle, onClose, children }: ShellProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="min-w-0">
          {subtitle && (
            <div className="text-[11px] tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </div>
          )}
          <h2 id="dialog-title" className="text-sm font-medium tracking-[0.2em] text-slate-600 dark:text-slate-300 truncate">
            {title}
          </h2>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-xs text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400"
          >
            关闭 ✕
          </button>
        )}
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-thin px-5 py-4">
        {children}
      </div>
    </div>
  )
}

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

/**
 * 标准 dialog —— 居中 modal，免责声明样式。
 * 受控: `open` 控制显示，关闭(背景点击 / ESC / 关闭按钮)统一回调 `onClose`。
 */
export function Dialog({ open, onClose, title, subtitle, children, className }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const node = (
    <div
      role="presentation"
      onMouseDown={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm md:p-6"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={[
          'flex max-h-[85vh] w-[min(720px,92vw)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-inherit shadow-2xl dark:border-slate-800 dark:bg-slate-900',
          className ?? '',
        ].join(' ')}
      >
        <Shell title={title} subtitle={subtitle} onClose={onClose}>
          {children}
        </Shell>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

interface DialogPanelProps {
  title: string
  subtitle?: string
  /** 提供则显示关闭按钮 (sticky 面板可用来"清空 focused")。 */
  onClose?: () => void
  children: ReactNode
  className?: string
}

/**
 * 与 Dialog 同款样式的 sticky 右侧面板 —— 用于桌面端常驻"释义"等场景。
 * 内部 chrome (header + 滚动 body) 与 Dialog 完全一致。
 */
export function DialogPanel({ title, subtitle, onClose, children, className }: DialogPanelProps) {
  return (
    <aside
      className={[
        'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] sticky top-6',
        className ?? '',
      ].join(' ')}
    >
      <Shell title={title} subtitle={subtitle} onClose={onClose}>
        {children}
      </Shell>
    </aside>
  )
}
