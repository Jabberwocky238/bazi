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

/** 一条可加载的 skill 词条。 */
export interface SkillItem {
  category: SkillCategory
  name: string
  subtitle?: string
}

function catSubtitle(category: SkillCategory, subtitle?: string): string {
  const base = CATEGORY_LABEL[category] ?? category
  return subtitle ? `${base} · ${subtitle}` : base
}

/**
 * 纯正文 —— 给定 category/name 拉取 skill markdown 并渲染。
 * 不含 Dialog 外壳，供 single / multiple 复用。
 */
export function SkillBody({ category, name }: { category: SkillCategory; name: string }) {
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

  if (err) return <div className="py-6 text-sm text-slate-500 dark:text-slate-400 text-center">{err}</div>
  if (md === null) return <div className="py-6 text-sm text-slate-500">加载中…</div>
  return (
    <article className="prose-bazi">
      <Markdown remarkPlugins={[remarkGfm]}>{md}</Markdown>
    </article>
  )
}

// ————————————————————————————————————————————————————————
// single —— 点击即打开词条详情 (无返回箭头)
// ————————————————————————————————————————————————————————

interface SingleProps {
  category: SkillCategory
  name: string
  subtitle?: string
  onClose: () => void
}

export function SkillDialogContent({ category, name, subtitle, onClose }: SingleProps) {
  return (
    <Dialog open onClose={onClose} title={name} subtitle={catSubtitle(category, subtitle)}>
      <SkillBody category={category} name={name} />
    </Dialog>
  )
}

// ————————————————————————————————————————————————————————
// multiple —— 列表 ↔ 详情, 详情左上角 ← 返回列表, 右上角 ✕ 关闭
// ————————————————————————————————————————————————————————

interface MultiProps {
  items: SkillItem[]
  /** 列表视图标题。 */
  title: string
  onClose: () => void
}

export function MultiSkillDialog({ items, title, onClose }: MultiProps) {
  const [selected, setSelected] = useState<SkillItem | null>(null)

  return (
    <Dialog
      open
      onClose={onClose}
      title={selected ? selected.name : title}
      subtitle={selected ? catSubtitle(selected.category, selected.subtitle) : '选择词条'}
      onBack={selected ? () => setSelected(null) : undefined}
    >
      {selected ? (
        <SkillBody category={selected.category} name={selected.name} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {items.map((it) => (
            <button
              key={`${it.category}:${it.name}`}
              type="button"
              onClick={() => setSelected(it)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{it.name}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{it.subtitle ?? CATEGORY_LABEL[it.category] ?? it.category}</span>
            </button>
          ))}
        </div>
      )}
    </Dialog>
  )
}
