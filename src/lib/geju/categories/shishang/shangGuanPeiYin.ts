import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 伤官佩印（依 md 5 条）：
 *  1. 伤官透干通根 OR 月令本气。
 *  2. 印透干通根，力不弱于伤官。
 *  3. 身弱。
 *  4. 无财**紧贴**克印。
 *  5. 无正官透。
 */
export function isShangGuanPeiYin(ctx: Ctx): GejuHit | null {
  const monthMainShang = ctx.pillars.month.hideShishen[0] === '伤官'
  const shangTouRoot = ctx.tou('伤官') && ctx.zang('伤官')
  if (!monthMainShang && !shangTouRoot) return null
  if (!ctx.tou('伤官')) return null
  // md 条件 2: 印透通根
  if (!ctx.touCat('印')) return null
  if (!(ctx.zang('正印') || ctx.zang('偏印'))) return null
  // md 条件 3: 身弱
  if (!ctx.shenRuo) return null
  // md 条件 4: 财紧贴印才破
  const caiAdjYin =
    ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
    ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')
  if (caiAdjYin) return null
  // md 条件 5: 无正官透
  if (ctx.tou('正官')) return null
  return { name: '伤官佩印', note: '身弱 · 伤印双透根 · 无紧贴财破印 · 无正官透' }
}
