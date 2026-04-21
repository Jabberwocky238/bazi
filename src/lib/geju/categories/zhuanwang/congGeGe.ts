import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/**
 * 从革格：庚辛金日主专旺。
 *
 * 变体 (guigeVariant, 依 md)：
 *  - 从革清秀：从革 + 水点缀 (金生水泄秀) —— "剑如秋水"，最佳形态。
 *  - 无变体：纯金从革，偏冷刚孤寂。
 */
export function isCongGeGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '金')
  if (!r) return null
  const shuiN = ctx.ganWxCount('水') + ctx.zhiMainWxCount('水')
  const hasShui = shuiN > 0
  return {
    name: '从革格',
    note: `${r.note}${hasShui ? ` · 水泄秀 ${shuiN} 位` : ''}`,
    ...(hasShui ? { guigeVariant: '从革清秀' } : {}),
  }
}
