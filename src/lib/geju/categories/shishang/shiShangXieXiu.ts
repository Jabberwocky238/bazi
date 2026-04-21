import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 食伤泄秀（依 md 4 条 + 1 辅）：
 *  1. 身强。
 *  2. 食/伤透干通根 OR 月令本气。
 *  3. 不混杂 (食或伤为主)。
 *  4. 无枭印紧贴克食伤 (或有财护)。
 */
export function isShiShangXieXiu(ctx: Ctx): GejuHit | null {
  if (!ctx.shenWang) return null
  const shiTouRoot = ctx.tou('食神') && ctx.zang('食神')
  const shangTouRoot = ctx.tou('伤官') && ctx.zang('伤官')
  const monthMain = ctx.pillars.month.hideShishen[0]
  const monthIsShiShang = monthMain === '食神' || monthMain === '伤官'
  if (!shiTouRoot && !shangTouRoot && !monthIsShiShang) return null
  // md 条件 3: 不混杂 (至少一方仅藏支或不透)
  if (ctx.tou('食神') && ctx.tou('伤官')) return null
  // md 条件 4: 枭紧贴食伤 且 无财救
  const xiaoAdj =
    ctx.adjacentTou('偏印', '食神') || ctx.adjacentTou('偏印', '伤官')
  if (xiaoAdj && !ctx.touCat('财')) return null
  return { name: '食伤泄秀', note: '身旺 · 食/伤透根泄秀 · 清而不杂' }
}
