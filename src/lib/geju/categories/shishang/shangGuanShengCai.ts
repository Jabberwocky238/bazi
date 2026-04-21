import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 伤官生财（依 md 5 条）：
 *  1. 伤官透干通根 OR 月令本气。
 *  2. 财星透干通根。
 *  3. 伤→财位置相连，无印阻。
 *  4. 身强。
 *  5. 无正官紧贴；有七杀须被合/制。
 */
export function isShangGuanShengCai(ctx: Ctx): GejuHit | null {
  const monthMainShang = ctx.pillars.month.hideShishen[0] === '伤官'
  const shangTouRoot = ctx.tou('伤官') && ctx.zang('伤官')
  if (!monthMainShang && !shangTouRoot) return null
  if (!ctx.tou('伤官')) return null
  // md 条件 2: 财透通根
  const caiTouRoot =
    (ctx.tou('正财') && ctx.zang('正财')) ||
    (ctx.tou('偏财') && ctx.zang('偏财'))
  if (!caiTouRoot) return null
  // md 条件 3: 伤↔财相邻
  const adjCai =
    ctx.adjacentTou('伤官', '正财') || ctx.adjacentTou('伤官', '偏财')
  if (!adjCai) return null
  if (ctx.touCat('印')) return null                           // md: 印阻
  if (!ctx.shenWang) return null                              // md: 必身强
  if (ctx.tou('正官') && ctx.adjacentTou('伤官', '正官')) return null
  return { name: '伤官生财', note: '身强 · 伤财双透根相邻 · 无印阻无官紧贴' }
}
