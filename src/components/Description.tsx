import { type ReactNode } from 'react'
import { skillUrl, type SkillCategory } from 'bazilib'
import { useDialog } from '@@/Dialog'
import { SkillDetail, SkillListModal, skillSubtitle, type SkillItem } from './SkillDetail'

export type { SkillItem } from './SkillDetail'

const GLOW_CLASSES = [
  'cursor-pointer rounded transition-[box-shadow,filter] duration-150',
  // 圆边光 = --glow-color（调用方可覆盖，如用吉凶色）；默认退回到当前字色
  'hover:shadow-[0_0_14px_-1px_var(--glow-color,currentColor)]',
  // 字体光 = 当前字色（category 色）
  'hover:drop-shadow-[0_0_3px_currentColor]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40',
]

// 无光晕版本: 仅保留可点击指针与焦点环, 用于 foreignObject/SVG 等会因 hover 重排而抖动的场景
const PLAIN_CLASSES = [
  'cursor-pointer rounded',
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
  /** 是否启用 hover 光晕动画 (默认启用); foreignObject/SVG 内建议关闭以防重排抖动。 */
  glow?: boolean
  children: ReactNode
  className?: string
}

/**
 * 释义入口 —— 包裹任意词条。
 *
 * - single (默认): 传 category + name, 点击直接打开该词条详情 Modal。
 * - multiple: 传 items (≥2 项有效 skill), 点击先打开"词条列表" Modal,
 *   再点某条才进入详情; 详情左上角 ← 返回列表, 右上角 ✕ 关闭。
 *
 * 无对应 skill 时降级为纯文本, 不渲染可点击元素。
 */
export function Description({ category, name, subtitle, items, listTitle, glow = true, children, className }: Props) {
  const { open } = useDialog()
  const base = glow ? GLOW_CLASSES : PLAIN_CLASSES

  const validItems = (items ?? []).filter((i) => skillUrl(i.category, i.name))

  // multiple
  if (validItems.length > 1) {
    const title = listTitle ?? (typeof children === 'string' ? children : '词条列表')
    return (
      <button
        type="button"
        onClick={() => open(
          (api) => <SkillListModal items={validItems} title={title} api={api} />,
          { title, subtitle: '选择词条' },
        )}
        className={[...base, className ?? ''].join(' ')}
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
      onClick={() => open(
        <SkillDetail category={single.category} name={single.name} />,
        {
          title: single.name,
          subtitle: skillSubtitle(single.category, single.subtitle),
        },
      )}
      className={[...base, className ?? ''].join(' ')}
    >
      {children}
    </button>
  )
}
