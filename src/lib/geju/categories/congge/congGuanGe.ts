import { WX_CONTROLLED_BY, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从官格（依 md 7 条）：
 *  1. 极弱无根。
 *  2. 月令为正官 (本气)。
 *  3. 正官 ≥ 财 && > 食伤；不混七杀。
 *  4. 无食伤。
 *  5. 无印。
 *  6. 无比劫。
 */
export function isCongGuanGe(ctx: Ctx): GejuHit | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (ctx.countCat('食伤') > 0) return null
  if (!ctx.tou('正官')) return null
  if (ctx.tou('七杀')) return null
  // md 条件 2: 月令本气正官 (或 monthCat === '官杀' 配合透正官)
  if (ctx.monthCat !== '官杀') return null
  // md 条件 3: 正官数量 ≥ 财
  if (ctx.countOf('正官') < ctx.countCat('财')) return null
  const gwWx = WX_CONTROLLED_BY[ctx.dayWx] as WuXing
  if (ctx.zhiMainWxCount(gwWx) < 2) return null
  return { name: '从官格', note: `无比印食伤，月令正官通根 ${gwWx} ≥ 2 位` }
}
