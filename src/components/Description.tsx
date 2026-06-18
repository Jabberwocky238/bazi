import { type ReactNode } from 'react'
import { skillUrl, type SkillCategory } from '@/lib'
import { useDialog } from '@@/Dialog'
import { SkillDialogContent, MultiSkillDialog, type SkillItem } from './SkillDialogContent'

export type { SkillItem } from './SkillDialogContent'

const GLOW_CLASSES = [
  'cursor-pointer rounded transition-[box-shadow,filter] duration-150',
  // 圆边光 = --glow-color（调用方可覆盖，如用吉凶色）；默认退回到当前字色
  'hover:shadow-[0_0_14px_-1px_var(--glow-color,currentColor)]',
  // 字体光 = 当前字色（category 色）
  'hover:drop-shadow-[0_0_3px_currentColor]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40',
]

interface Props {
  /** single 模式: 词条类别。 */
  category?: SkillCategory
  /** single 模式: 词条名。 */
  name?: string
  /** single 模式: 副标题。 */
  subtitle?: string
  /** multiple 模式: 词条列表 (≥2 项有效时启用)。 */
  items?: SkillItem[]
  /** multiple 模式: 列表 dialog 标题, 默认取 children 文本。 */
  listTitle?: string
  children: ReactNode
  className?: string
}

/**
 * 释义入口 —— 包裹任意词条。
 *
 * - single (默认): 传 category + name, 点击直接打开该词条详情 Dialog。
 * - multiple: 传 items (≥2 项有效 skill), 点击先打开"词条列表" Dialog,
 *   再点某条才进入详情; 详情左上角 ← 返回列表, 右上角 ✕ 关闭。
 *
 * 无对应 skill 时降级为纯文本, 不渲染可点击元素。
 */
export function Description({ category, name, subtitle, items, listTitle, children, className }: Props) {
  const { open } = useDialog()

  const validItems = (items ?? []).filter((i) => skillUrl(i.category, i.name))

  // multiple
  if (validItems.length > 1) {
    const title = listTitle ?? (typeof children === 'string' ? children : '词条列表')
    return (
      <button
        type="button"
        onClick={() => open((onClose) => (
          <MultiSkillDialog items={validItems} title={title} onClose={onClose} />
        ))}
        className={[...GLOW_CLASSES, className ?? ''].join(' ')}
      >
        {children}
      </button>
    )
  }

  // single (含 multiple 仅 1 项有效时退化)
  const single: SkillItem | null = validItems.length === 1
    ? validItems[0]
    : (category && name && skillUrl(category, name) ? { category, name, subtitle } : null)

  if (!single) return <span className={className}>{children}</span>

  return (
    <button
      type="button"
      onClick={() => open((onClose) => (
        <SkillDialogContent
          category={single.category}
          name={single.name}
          subtitle={single.subtitle}
          onClose={onClose}
        />
      ))}
      className={[...GLOW_CLASSES, className ?? ''].join(' ')}
    >
      {children}
    </button>
  )
}
