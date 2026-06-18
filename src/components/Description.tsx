import { type ReactNode } from 'react'
import { skillUrl, type SkillCategory } from '@/lib'
import { useDialog } from '@@/Dialog'
import { SkillDialogContent } from './SkillDialogContent'

interface Props {
  category: SkillCategory
  name: string
  subtitle?: string
  children: ReactNode
  className?: string
}

/**
 * 释义入口 —— 包裹任意词条。点击后命令式唤起一个 Dialog，
 * 按 category/name 加载对应 skill markdown 并展示。
 * 无对应 skill 时降级为纯文本，不渲染可点击元素。
 */
export function Description({ category, name, subtitle, children, className }: Props) {
  const { open } = useDialog()
  const hasSkill = !!skillUrl(category, name)

  if (!hasSkill) return <span className={className}>{children}</span>

  return (
    <button
      type="button"
      onClick={() =>
        open((onClose) => (
          <SkillDialogContent
            category={category}
            name={name}
            subtitle={subtitle}
            onClose={onClose}
          />
        ))
      }
      className={[
        'cursor-pointer rounded transition-[box-shadow,filter] duration-150',
        // 圆边光 = --glow-color（调用方可覆盖，如用吉凶色）；默认退回到当前字色
        'hover:shadow-[0_0_14px_-1px_var(--glow-color,currentColor)]',
        // 字体光 = 当前字色（category 色）
        'hover:drop-shadow-[0_0_3px_currentColor]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40',
        className ?? '',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
