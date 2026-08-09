import { useEffect, useRef, useState, type RefObject } from 'react'
import type { BaziCopyData } from './baziCopy'
import { copyText, formatBaziAnalysisCopyText } from './baziCopy'

type CopyStatus = 'idle' | 'copied' | 'error'

interface CopyBaziButtonProps extends BaziCopyData {
  contentRef: RefObject<HTMLElement | null>
}

export function CopyBaziButton({ contentRef, ...data }: CopyBaziButtonProps) {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  const handleCopy = async () => {
    window.clearTimeout(resetTimer.current)
    try {
      if (!contentRef.current) throw new Error('Analysis content is unavailable')
      await copyText(formatBaziAnalysisCopyText(data, contentRef.current))
      setStatus('copied')
    } catch {
      setStatus('error')
    }
    resetTimer.current = window.setTimeout(() => setStatus('idle'), 2000)
  }

  const label = status === 'copied'
    ? '已复制'
    : status === 'error'
      ? '复制失败'
      : '复制全部分析'

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-8 min-w-24 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-amber-600 hover:text-amber-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400"
      aria-live="polite"
    >
      {label}
    </button>
  )
}
