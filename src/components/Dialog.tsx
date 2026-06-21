import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { ModalShell } from './Modal'

// ============= 命令式浮层栈 (dialog = 位置) =============
//
// "dialog" 在本工程里是一个**位置**概念 —— 由 DialogProvider 在固定位置
// 托管的浮层栈; 业务方通过 useDialog().open(...) 命令式地把内容投递到该位置,
// 并由 Provider 统一负责 portal / 堆叠 z-index / 滚动锁 / ESC / 背景点击。
//
// 这是浮层的**唯一**打开方式 —— 不再有"受控 <Modal open>"第二种写法。
// 真正的浮层**组件**外壳叫 ModalShell (见 Modal.tsx)。
//
// 嵌套: open() 可在已打开的浮层内再次调用, 后入者 z-index 更高、盖在上层;
// ESC / 背景点击只关最顶层; 滚动锁按"栈非空即锁"在 0↔非0 边界切换, 不会
// 因中间层开关而抖动。

/** 浮层外壳配置 (标题 / 副标题 / 返回箭头 / 关闭策略)。 */
export interface DialogChrome {
  title: string
  subtitle?: string
  /** 提供则显示左上角"← 返回"箭头 (eg. 从详情返回列表)。 */
  onBack?: () => void
  /** 点击背景是否关闭, 默认 true。 */
  closeOnBackdropClick?: boolean
  /** 按 ESC 是否关闭, 默认 true。 */
  closeOnEscape?: boolean
  /** 透传给浮层面板的额外 className。 */
  className?: string
}

/** 传给内容 render-prop 的命令式 api —— 内容可据此自关或动态改外壳。 */
export interface DialogContentApi {
  /** 关闭本浮层。 */
  close: () => void
  /** 动态改标题 (eg. 列表 ↔ 详情切换时)。 */
  setTitle: (title: string) => void
  /** 动态改副标题。 */
  setSubtitle: (subtitle?: string) => void
  /** 动态改/清返回箭头回调。 */
  setOnBack: (onBack?: () => void) => void
}

/** 浮层内容: 纯节点, 或接收 api 的 render-prop。 */
export type DialogContent = ReactNode | ((api: DialogContentApi) => ReactNode)

interface DialogEntry {
  id: string
  chrome: DialogChrome
  content: DialogContent
}

interface DialogApi {
  /** 打开一个浮层, 返回 id (用于手动关闭)。 */
  open: (content: DialogContent, chrome: DialogChrome) => string
  /** 关闭指定 id 的浮层。 */
  close: (id: string) => void
  /** 关闭所有浮层。 */
  closeAll: () => void
  /** 快捷确认框, 返回 id。 */
  confirm: (message: string, onConfirm: () => void, title?: string) => string
  /** 快捷提示框, 返回 id。 */
  alert: (message: string, title?: string) => string
}

const DialogContext = createContext<DialogApi | null>(null)

const DEFAULT_CHROME: Pick<DialogChrome, 'closeOnBackdropClick' | 'closeOnEscape'> = {
  closeOnBackdropClick: true,
  closeOnEscape: true,
}

let idSeq = 0
const genId = () => `dlg-${++idSeq}`

interface DialogProviderProps {
  children: ReactNode
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [entries, setEntries] = useState<DialogEntry[]>([])

  const patchChrome = useCallback((id: string, patch: Partial<DialogChrome>) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, chrome: { ...e.chrome, ...patch } } : e)),
    )
  }, [])

  const close = useCallback((id: string) => {
    setEntries((prev) => (prev.some((e) => e.id === id) ? prev.filter((e) => e.id !== id) : prev))
  }, [])

  const closeAll = useCallback(() => setEntries([]), [])

  const open = useCallback((content: DialogContent, chrome: DialogChrome) => {
    const id = genId()
    setEntries((prev) => [...prev, { id, chrome: { ...DEFAULT_CHROME, ...chrome }, content }])
    return id
  }, [])

  const confirm = useCallback(
    (message: string, onConfirm: () => void, title = '确认操作') => {
      return open(
        ({ close: selfClose }) => (
          <>
            <div className="py-4 text-sm text-slate-700 dark:text-slate-300">{message}</div>
            <div className="flex gap-2 justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={selfClose}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-sm"
              >
                取消
              </button>
              <button
                onClick={() => {
                  onConfirm()
                  selfClose()
                }}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-sm"
              >
                确认
              </button>
            </div>
          </>
        ),
        { title },
      )
    },
    [open],
  )

  const alert = useCallback(
    (message: string, title = '提示') => {
      return open(
        ({ close: selfClose }) => (
          <>
            <div className="py-6 text-sm text-slate-700 dark:text-slate-300 text-center">{message}</div>
            <div className="flex justify-center pb-4">
              <button
                onClick={selfClose}
                className="px-6 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-sm"
              >
                知道了
              </button>
            </div>
          </>
        ),
        { title },
      )
    },
    [open],
  )

  // ESC —— 只关最顶层一个 (且需允许 ESC 关闭)。
  useEffect(() => {
    if (entries.length === 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i]
        if (entry.chrome.closeOnEscape !== false) {
          close(entry.id)
          break
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [entries, close])

  // 滚动锁 —— 仅在栈 0↔非0 边界切换, 嵌套开关中间层不会抖动。
  const wasOpenRef = useRef(false)
  const prevOverflowRef = useRef('')
  useEffect(() => {
    const isOpen = entries.length > 0
    if (isOpen && !wasOpenRef.current) {
      prevOverflowRef.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    } else if (!isOpen && wasOpenRef.current) {
      document.body.style.overflow = prevOverflowRef.current
    }
    wasOpenRef.current = isOpen
  }, [entries.length])

  const api: DialogApi = { open, close, closeAll, confirm, alert }

  return (
    <DialogContext.Provider value={api}>
      {children}
      {entries.map((entry, index) => {
        const selfClose = () => close(entry.id)
        const contentApi: DialogContentApi = {
          close: selfClose,
          setTitle: (title) => patchChrome(entry.id, { title }),
          setSubtitle: (subtitle) => patchChrome(entry.id, { subtitle }),
          setOnBack: (onBack) => patchChrome(entry.id, { onBack }),
        }
        const body =
          typeof entry.content === 'function'
            ? (entry.content as (a: DialogContentApi) => ReactNode)(contentApi)
            : entry.content
        return createPortal(
          <div
            key={entry.id}
            style={{ zIndex: 1000 + index }}
            className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 md:p-6 animate-fade-in"
            onClick={entry.chrome.closeOnBackdropClick !== false ? selfClose : undefined}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className={[
                'flex max-h-[85vh] w-[min(720px,92vw)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 text-inherit shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-scale-in',
                entry.chrome.className ?? '',
              ].join(' ')}
            >
              <ModalShell
                title={entry.chrome.title}
                subtitle={entry.chrome.subtitle}
                onClose={selfClose}
                onBack={entry.chrome.onBack}
              >
                {body}
              </ModalShell>
            </div>
          </div>,
          document.body,
        )
      })}
    </DialogContext.Provider>
  )
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog must be used within a DialogProvider')
  return ctx
}
