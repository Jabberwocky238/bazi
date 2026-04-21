import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 从势格（依 md 4 条）：
 *  1. 极弱无根。
 *  2. 三党 (食伤/财/官杀) **都有且力量相近**，无一方独大。
 *  3. 无印无比劫。
 *  4. 月令可食伤/财/官杀，不可比/印。
 */
export function isCongShiGe(ctx: Ctx): GejuHit | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  const categories = ['食伤', '财', '官杀'] as const
  const counts = categories.map((c) => ctx.countCat(c))
  // md 条件 2: 三党都有且力量相近 (差距不超过 2)
  if (counts.some((n) => n < 1)) return null
  const diff = Math.max(...counts) - Math.min(...counts)
  if (diff > 2) return null
  const active = categories.filter((c) => ctx.touCat(c))
  return { name: '从势格', note: `无根 · 月令非印比 · ${active.join('/')} 三党势均` }
}
