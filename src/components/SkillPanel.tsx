import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useBaziStore, type SkillFocus } from '@/lib/store'
import { loadSkill, skillUrl } from '@/lib/skills'
import { useMediaQuery } from '@/lib/hooks'

const CATEGORY_LABEL: Record<string, string> = {
  shishen: '十神',
  shensha: '神煞',
  tiangan: '天干',
  dizhi: '地支',
  gongwei: '宫位',
  geju: '格局',
}

function useSkillBody(focused: SkillFocus | null) {
  const [md, setMd] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!focused) {
      setMd(null)
      setErr(null)
      return
    }
    const url = skillUrl(focused.category, focused.name)
    if (!url) return
    setMd(null)
    setErr(null)
    loadSkill(url).then(setMd).catch((e) => setErr(String(e)))
  }, [focused])

  return { md, err }
}

function Header({ focused, onClose }: { focused: SkillFocus | null; onClose: () => void }) {
  return (
    <header className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
      <div className="min-w-0">
        {focused ? (
          <>
            <div className="text-[11px] tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
              {CATEGORY_LABEL[focused.category] ?? focused.category}
              {focused.subtitle ? ` · ${focused.subtitle}` : ''}
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
              {focused.name}
            </h2>
          </>
        ) : (
          <>
            <div className="text-[11px] tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
              释义
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              选一个词条
            </h2>
          </>
        )}
      </div>
      {focused && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 text-2xl leading-none px-2"
          aria-label="关闭释义"
        >
          ×
        </button>
      )}
    </header>
  )
}

function Body({ focused, md, err }: { focused: SkillFocus | null; md: string | null; err: string | null }) {
  if (!focused) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        点击命盘中任意 <b className="text-slate-700 dark:text-slate-200">十神</b> /{' '}
        <b className="text-slate-700 dark:text-slate-200">天干地支</b> /{' '}
        <b className="text-slate-700 dark:text-slate-200">神煞</b> /{' '}
        <b className="text-slate-700 dark:text-slate-200">格局</b>{' '}
        词条查看详细释义。
      </p>
    )
  }
  if (err) return <div className="text-sm text-red-500">加载失败：{err}</div>
  if (!md) return <div className="text-sm text-slate-500">加载中…</div>
  return (
    <article className="prose-bazi">
      <Markdown remarkPlugins={[remarkGfm]}>{md}</Markdown>
    </article>
  )
}

export function SkillPanel() {
  const focused = useBaziStore((s) => s.focused)
  const setFocused = useBaziStore((s) => s.setFocused)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { md, err } = useSkillBody(focused)

  if (isDesktop) return <DesktopPanel focused={focused} md={md} err={err} onClose={() => setFocused(null)} />
  return <MobileDialog focused={focused} md={md} err={err} onClose={() => setFocused(null)} />
}

function DesktopPanel({
  focused, md, err, onClose,
}: { focused: SkillFocus | null; md: string | null; err: string | null; onClose: () => void }) {
  return (
    <aside className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm overflow-hidden flex flex-col max-h-[calc(100vh-3rem)] sticky top-6">
      <Header focused={focused} onClose={onClose} />
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        <Body focused={focused} md={md} err={err} />
      </div>
    </aside>
  )
}

function MobileDialog({
  focused, md, err, onClose,
}: { focused: SkillFocus | null; md: string | null; err: string | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogRef.current
    if (!d) return
    if (focused && !d.open) d.showModal()
    else if (!focused && d.open) d.close()
  }, [focused])

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
      className="m-0 mt-auto mb-0 w-full max-w-full h-[92vh] max-h-[92vh] rounded-t-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 text-inherit shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm fixed inset-x-0 bottom-0 top-auto"
    >
      <div className="flex flex-col h-full">
        <Header focused={focused} onClose={onClose} />
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
          <Body focused={focused} md={md} err={err} />
        </div>
      </div>
    </dialog>
  )
}

