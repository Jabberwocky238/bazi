import { type ReactNode } from 'react'

// ============= 基础 UI 组件 =============
//
// 这里是"组件"层 —— ModalShell (浮层共享 chrome) / SidePanel (sticky 侧栏)。
// 与之相对, "dialog" 是一个位置概念 (由 DialogProvider/useDialog 管理的命令式
// 浮层栈, 见 Dialog.tsx)。两者分离: dialog=位置, Modal*=组件。
//
// 注: 居中浮层本身不再是一个受控组件 —— 由 DialogProvider 统一托管
// (portal / 堆叠 z-index / 滚动锁 / ESC / 背景点击), 这里只保留它复用的
// header+滚动 body 外壳, 以及桌面端 sticky 侧栏。

interface ShellProps {
  title: string
  /** 标题上方一行小字 (eg. category 标签)。 */
  subtitle?: string
  /** 提供则显示右上角"关闭 ✕"。 */
  onClose?: () => void
  /** 提供则显示左上角"← 返回"箭头 (eg. 从详情返回列表)。 */
  onBack?: () => void
  children: ReactNode
}

/** 共享 chrome —— header (可选返回箭头 + subtitle + title + 可选关闭) + 滚动 body。 */
export function ModalShell({ title, subtitle, onClose, onBack, children }: ShellProps) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="返回"
              className="shrink-0 text-base leading-none text-slate-400 hover:text-amber-700 dark:hover:text-amber-400"
            >
              ←
            </button>
          )}
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

interface SidePanelProps {
  title: string
  subtitle?: string
  /** 提供则显示关闭按钮 (sticky 面板可用来"清空 focused")。 */
  onClose?: () => void
  /** 提供则显示左上角"← 返回"箭头。 */
  onBack?: () => void
  children: ReactNode
  className?: string
}

/**
 * 与浮层同款样式的 sticky 右侧面板 —— 用于桌面端常驻"释义"等场景。
 * 内部 chrome (header + 滚动 body) 与 ModalShell 完全一致。
 */
export function SidePanel({ title, subtitle, onClose, onBack, children, className }: SidePanelProps) {
  return (
    <aside
      className={[
        'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] sticky top-6',
        className ?? '',
      ].join(' ')}
    >
      <ModalShell title={title} subtitle={subtitle} onClose={onClose} onBack={onBack}>
        {children}
      </ModalShell>
    </aside>
  )
}
