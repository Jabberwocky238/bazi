import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 弃命从势（依 md 4 条）：
 *  1. 日主无根 (含中气) —— 比劫/印即便虚透亦无地支主气/中气可靠。
 *  2. 三党 (食伤/财/官杀) **都有且力量相近**，无一方独大。
 *  3. 月令不可比劫/印。
 *  4. 三党力量差距 ≤ 2。
 */
export function isCongShiGe(ctx: Ctx): GejuHit | null {
  // md 条件 1: 日主无根 (主气 / 中气均无自身五行)
  if (ctx.rootExt(ctx.dayWx)) return null
  // md 条件 3: 月令非比劫/印
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  // md 条件 2 + 4: 三党都有且势均
  const categories = ['食伤', '财', '官杀'] as const
  const counts = categories.map((c) => ctx.countCat(c))
  if (counts.some((n) => n < 1)) return null
  const diff = Math.max(...counts) - Math.min(...counts)
  if (diff > 2) return null
  const active = categories.filter((c) => ctx.touCat(c))
  return { name: '弃命从势', note: `日主无根 · 月令非印比 · ${active.join('/')} 三党势均` }
}
