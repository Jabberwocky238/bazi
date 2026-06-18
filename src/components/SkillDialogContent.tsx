import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { loadSkill, skillUrl, type SkillCategory } from '@/lib'
import { Dialog } from '@@/Dialog'

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

interface Props {
  category: SkillCategory
  name: string
  subtitle?: string
  onClose: () => void
}

/**
 * 释义 Dialog 内容 —— 给定 category/name，拉取对应 skill markdown 并渲染。
 * 由 Description 通过 useDialog().open() 命令式唤起。
 */
export function SkillDialogContent({ category, name, subtitle, onClose }: Props) {
  const [md, setMd] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const url = skillUrl(category, name)
    if (!url) {
      setErr('暂无释义')
      return
    }
    setMd(null)
    setErr(null)
    let alive = true
    loadSkill(url)
      .then((text) => { if (alive) setMd(text) })
      .catch((e) => { if (alive) setErr(String(e)) })
    return () => { alive = false }
  }, [category, name])

  const title = name
  const dialogSubtitle = `${CATEGORY_LABEL[category] ?? category}${subtitle ? ` · ${subtitle}` : ''}`

  return (
    <Dialog open onClose={onClose} title={title} subtitle={dialogSubtitle}>
      {err ? (
        <div className="py-6 text-sm text-slate-500 dark:text-slate-400 text-center">{err}</div>
      ) : md === null ? (
        <div className="py-6 text-sm text-slate-500">加载中…</div>
      ) : (
        <article className="prose-bazi">
          <Markdown remarkPlugins={[remarkGfm]}>{md}</Markdown>
        </article>
      )}
    </Dialog>
  )
}
