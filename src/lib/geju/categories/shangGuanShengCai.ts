import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 伤官生财（依 md 5 条，放宽 1/2/3/4）：
 *  1. 伤官显：透干 或 月令本气。
 *  2. 财显：类级透干 OR 藏干 (正偏财不分)。
 *  3. 无印紧贴伤官/财。
 *  4. 日主非极弱/近从弱。
 *  5. 无正官紧贴伤官。
 */
export function isShangGuanShengCai(ctx: Ctx): GejuHit | null {
  const monthMainShang = ctx.pillars.month.hideShishen[0] === '伤官'
  if (!ctx.tou('伤官') && !monthMainShang) return null
  const caiVisible =
    ctx.touCat('财') || ctx.zang('正财') || ctx.zang('偏财')
  if (!caiVisible) return null
  if (ctx.touCat('印')) {
    const yinAdjShang =
      ctx.adjacentTou('正印', '伤官') || ctx.adjacentTou('偏印', '伤官')
    const yinAdjCai =
      ctx.adjacentTou('正印', '正财') || ctx.adjacentTou('正印', '偏财') ||
      ctx.adjacentTou('偏印', '正财') || ctx.adjacentTou('偏印', '偏财')
    if (yinAdjShang || yinAdjCai) return null
  }
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  if (ctx.tou('正官') && ctx.adjacentTou('伤官', '正官')) return null
  return { name: '伤官生财', note: '伤官显 · 财显 · 无印紧贴阻 · 非极弱 · 无官克伤' }
}
