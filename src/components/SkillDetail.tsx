import { useEffect, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { loadSkill, skillUrl, type SkillCategory } from '@LIB'
import type { DialogContentApi } from '@@/Dialog'

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
 * 不含外壳, 供 single / multiple 复用。
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
// single —— 词条详情 (无返回箭头)。
// 外壳标题/副标题在打开时设定; 这里仅渲染正文。
// ————————————————————————————————————————————————————————

interface SingleProps {
  category: SkillCategory
  name: string
}

/** 单词条正文; 调用方 open(<SkillDetail .../>, { title: name, subtitle: catSubtitle(...) })。 */
export function SkillDetail({ category, name }: SingleProps) {
  return <SkillBody category={category} name={name} />
}

/** 调用方计算副标题用。 */
export function skillSubtitle(category: SkillCategory, subtitle?: string): string {
  return catSubtitle(category, subtitle)
}

// ————————————————————————————————————————————————————————
// multiple —— 列表 ↔ 详情, 详情左上角 ← 返回列表, 右上角 ✕ 关闭。
// 标题/副标题/返回箭头随选中状态动态变化, 通过 api 改写外壳。
// ————————————————————————————————————————————————————————

interface MultiProps {
  items: SkillItem[]
  /** 列表视图标题。 */
  title: string
  api: DialogContentApi
}

export function SkillListModal({ items, title, api }: MultiProps) {
  const [selected, setSelected] = useState<SkillItem | null>(null)

  // 选中态 → 外壳切到"详情"; 清空 → 切回"列表"。
  useEffect(() => {
    if (selected) {
      api.setTitle(selected.name)
      api.setSubtitle(catSubtitle(selected.category, selected.subtitle))
      api.setOnBack(() => setSelected(null))
    } else {
      api.setTitle(title)
      api.setSubtitle('选择词条')
      api.setOnBack(undefined)
    }
  }, [selected, title, api])

  return selected ? (
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
  )
}
