import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 弃命从势（依 md 4 条）：
 *  1. 日主无根 (本气/中气均无日主五行) —— 天干虚透比劫/印不算有根。
 *  2. 月令非比劫/印。
 *  3. 三党 (食伤/财/官杀) 各 ≥ 2 位。
 *  4. 三党总和 ≥ 6，力量差距 ≤ 2。
 */
export function isCongShiGe(ctx: Ctx): GejuHit | null {
  // 条件 1: 日主无根 (本气/中气均无)
  if (ctx.rootExt(ctx.dayWx)) return null
  // 条件 2: 月令非比劫/印
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  // 条件 3 + 4
  const categories = ['食伤', '财', '官杀'] as const
  const counts = categories.map((c) => ctx.countCat(c))
  if (counts.some((n) => n < 2)) return null
  const total = counts.reduce((a, b) => a + b, 0)
  if (total < 6) return null
  const diff = Math.max(...counts) - Math.min(...counts)
  if (diff > 2) return null
  return {
    name: '弃命从势',
    note: `日主无根 · 月令非印比 · 食伤/财/官杀 (${counts.join('/')}, 共 ${total} 位) 势均`,
  }
}
