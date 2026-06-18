import {
  createContext,
  useContext,
  useState,
  useCallback,
  Fragment,
  type ReactNode,
} from 'react'
import { Dialog as HeadlessDialog, Transition } from '@headlessui/react'

// ============= 基础 UI 组件 =============

interface ShellProps {
  title: string
  /** 标题上方一行小字 (eg. category 标签)。 */
  subtitle?: string
  /** 提供则显示右上角"关闭 ✕"。 */
  onClose?: () => void
  children: ReactNode
}

/** 共享 chrome —— header (subtitle + title + 可选关闭) + 滚动 body。 */
export function DialogShell({ title, subtitle, onClose, children }: ShellProps) {
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
  /** 是否点击背景关闭，默认true */
  closeOnBackdropClick?: boolean
  /** 是否按ESC关闭，默认true */
  closeOnEscape?: boolean
}

/**
 * 标准受控 Dialog —— 居中 modal，支持动画、无障碍、自动焦点管理
 */
export function Dialog({
  open,
  onClose,
  title,
  subtitle,
  children,
  className,
  closeOnBackdropClick = true,
  closeOnEscape = true
}: DialogProps) {
  return (
    <Transition appear show={open} as={Fragment}>
      <HeadlessDialog
        as="div"
        className="relative z-[1000]"
        onClose={closeOnBackdropClick ? onClose : () => {}}
        closeOnEscape={closeOnEscape}
      >
        {/* 背景遮罩动画 */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        </Transition.Child>

        {/* 居中容器 */}
        <div className="fixed inset-0 overflow-y-auto p-3 md:p-6">
          <div className="flex min-h-full items-center justify-center text-center">
            {/* 弹窗内容动画 */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <HeadlessDialog.Panel
                className={[
                  'flex max-h-[85vh] w-[min(720px,92vw)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-inherit shadow-2xl dark:border-slate-800 dark:bg-slate-900 text-left',
                  className ?? '',
                ].join(' ')}
              >
                <DialogShell title={title} subtitle={subtitle} onClose={onClose}>
                  {children}
                </DialogShell>
              </HeadlessDialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </HeadlessDialog>
    </Transition>
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
      <DialogShell title={title} subtitle={subtitle} onClose={onClose}>
        {children}
      </DialogShell>
    </aside>
  )
}

// ============= 命令式调用 Context =============

/** 单个 dialog 的实例状态。 */
interface DialogInstance {
  id: string
  content: (onClose: () => void) => ReactNode
  container?: HTMLElement | null
}

interface DialogContextValue {
  /** 打开一个 dialog，返回该 dialog 的 id（用于手动关闭）。 */
  open: (
    content: (onClose: () => void) => ReactNode,
    options?: { container?: HTMLElement | null }
  ) => string
  /** 关闭指定 id 的 dialog。 */
  close: (id: string) => void
  /** 关闭所有 dialog。 */
  closeAll: () => void
  /** 快捷确认框。 */
  confirm: (message: string, onConfirm: () => void, title?: string) => string
  /** 快捷提示框。 */
  alert: (message: string, title?: string) => string
}

const DialogContext = createContext<DialogContextValue | null>(null)

/** 全局默认挂载点的 id。如果存在该元素，默认挂载到这里。 */
const GLOBAL_DIALOG_CONTAINER_ID = 'dialog-root'

function getDefaultContainer(): HTMLElement {
  const existing = document.getElementById(GLOBAL_DIALOG_CONTAINER_ID)
  if (existing) return existing
  return document.body
}

interface ManagedDialogProps {
  instance: DialogInstance
  onClose: () => void
}

function ManagedDialog({ instance, onClose }: ManagedDialogProps) {
  const content = instance.content(onClose)
  // 直接返回内容，不需要额外Portal，由Dialog组件内部自己处理Portal
  return content
}

interface DialogProviderProps {
  children: ReactNode
  /** 默认挂载容器（优先级低于 open 时手动指定）。 */
  defaultContainer?: HTMLElement | null
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [dialogs, setDialogs] = useState<DialogInstance[]>([])

  const open = useCallback(
    (
      content: (onClose: () => void) => ReactNode,
    ) => {
      const id = Math.random().toString(36).slice(2, 9)
      setDialogs((prev) => [
        ...prev,
        { id, content },
      ])
      return id
    },
    []
  )

  const close = useCallback((id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const closeAll = useCallback(() => {
    setDialogs([])
  }, [])

  // 快捷确认框
  const confirm = useCallback((message: string, onConfirm: () => void, title = '确认操作') => {
    return open((onClose) => (
      <Dialog
        open={true}
        onClose={onClose}
        title={title}
      >
        <div className="py-4 text-sm text-slate-700 dark:text-slate-300">{message}</div>
        <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-sm"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-sm"
          >
            确认
          </button>
        </div>
      </Dialog>
    ))
  }, [open])

  // 快捷提示框
  const alert = useCallback((message: string, title = '提示') => {
    return open((onClose) => (
      <Dialog
        open={true}
        onClose={onClose}
        title={title}
      >
        <div className="py-6 text-sm text-slate-700 dark:text-slate-300 text-center">{message}</div>
        <div className="flex justify-center pb-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-sm"
          >
            知道了
          </button>
        </div>
      </Dialog>
    ))
  }, [open])

  return (
    <DialogContext.Provider value={{ open, close, closeAll, confirm, alert }}>
      {children}
      {/* 渲染所有命令式打开的Dialog */}
      {dialogs.map((instance) => (
        <ManagedDialog
          key={instance.id}
          instance={instance}
          onClose={() => close(instance.id)}
        />
      ))}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const context = useContext(DialogContext)
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return context
}
