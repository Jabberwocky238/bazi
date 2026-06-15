import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 以财破印：印过旺成病（印≥3位）+ 财透干通根 + 日主有其他比劫/禄刃可承担。
 * 《子平真诠》"印太多而无财以制，其人多懒惰无成"——用在印盛时，不用在身弱时。
 */
export function isYiCaiPoYin(ctx: Ctx): GejuHit | null {
  // md 条件 1: 印过旺成病
  if (ctx.countCat('印') < 3) return null
  // md 条件 2: 财透通根 + 紧贴印
  const caiTouRoot =
    (ctx.tou('正财') && ctx.zang('正财')) ||
    (ctx.tou('偏财') && ctx.zang('偏财'))
  if (!caiTouRoot) return null
  const caiAdjYin =
    ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
    ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')
  if (!caiAdjYin) return null
  // md 条件 3: 身弱且无比劫 → 破印反损身
  if (ctx.shenRuo && ctx.countCat('比劫') === 0) return null
  // md 条件 4: 破印后有出口 (食伤 OR 官杀)
  if (!ctx.touCat('食伤') && !ctx.touCat('官杀')) return null
  return { name: '以财破印', note: `印 ${ctx.countCat('印')} 位成病，财紧贴破印有出口` }
}
