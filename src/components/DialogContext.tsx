import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

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
  return createPortal(
    instance.content(onClose),
    instance.container ?? getDefaultContainer()
  )
}

interface DialogProviderProps {
  children: ReactNode
  /** 默认挂载容器（优先级低于 open 时手动指定）。 */
  defaultContainer?: HTMLElement | null
}

export function DialogProvider({ children, defaultContainer }: DialogProviderProps) {
  const [dialogs, setDialogs] = useState<DialogInstance[]>([])

  const open = useCallback(
    (
      content: (onClose: () => void) => ReactNode,
      options?: { container?: HTMLElement | null }
    ) => {
      const id = Math.random().toString(36).slice(2, 9)
      setDialogs((prev) => [
        ...prev,
        { id, content, container: options?.container ?? defaultContainer },
      ])
      return id
    },
    [defaultContainer]
  )

  const close = useCallback((id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id))
  }, [])

  const closeAll = useCallback(() => {
    setDialogs([])
  }, [])

  return (
    <DialogContext.Provider value={{ open, close, closeAll }}>
      {children}
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
