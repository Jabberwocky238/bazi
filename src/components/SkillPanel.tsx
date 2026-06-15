import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { type SkillFocus, loadSkill, skillUrl } from '@/lib'
import { useBaziStore } from '@@/stores'
import { useMediaQuery } from '@@/hooks/useMediaQuery'
import { Dialog, DialogPanel } from '@@/Dialog'

const CATEGORY_LABEL: Record<string, string> = {
  shishen: '十神',
  shensha: '神煞',
  tiangan: '天干',
  dizhi: '地支',
  gongwei: '宫位',
  geju: '格局',
  jichu: '基础',
  zizuo: '自坐',
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

function titleOf(focused: SkillFocus | null): string {
  return focused?.name ?? '选一个词条'
}

function subtitleOf(focused: SkillFocus | null): string {
  if (!focused) return '释义'
  return `${CATEGORY_LABEL[focused.category] ?? focused.category}${focused.subtitle ? ` · ${focused.subtitle}` : ''}`
}

export function SkillPanel() {
  const focused = useBaziStore((s) => s.focused)
  const setFocused = useBaziStore((s) => s.setFocused)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const { md, err } = useSkillBody(focused)

  if (isDesktop) {
    // 桌面端：右侧常驻 sticky 面板，仅在已选中词条时给出"关闭"按钮。
    return (
      <DialogPanel
        title={titleOf(focused)}
        subtitle={subtitleOf(focused)}
        onClose={focused ? () => setFocused(null) : undefined}
      >
        <Body focused={focused} md={md} err={err} />
      </DialogPanel>
    )
  }

  // 移动端：与免责声明同款 modal Dialog。
  return (
    <Dialog
      open={!!focused}
      onClose={() => setFocused(null)}
      title={titleOf(focused)}
      subtitle={subtitleOf(focused)}
    >
      <Body focused={focused} md={md} err={err} />
    </Dialog>
  )
}
