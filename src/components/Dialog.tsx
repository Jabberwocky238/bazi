import { useEffect, useRef, type ReactNode } from 'react'

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
          <h2 className="text-sm font-medium tracking-[0.2em] text-slate-600 dark:text-slate-300 truncate">
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
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    const onCloseEvt = () => onClose()
    d.addEventListener('close', onCloseEvt)
    return () => d.removeEventListener('close', onCloseEvt)
  }, [onClose])

  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={onBackdropClick}
      className={[
        // open:flex 让 dialog 在打开时变 flex column，便于 Shell 的 flex-1 滚动正确生效
        // (UA 样式 dialog:not([open]) 仍会隐藏关闭态)。
        'open:flex flex-col m-auto w-[min(720px,92vw)] max-h-[85vh] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 text-inherit shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm',
        className ?? '',
      ].join(' ')}
    >
      <Shell title={title} subtitle={subtitle} onClose={() => dialogRef.current?.close()}>
        {children}
      </Shell>
    </dialog>
  )
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
