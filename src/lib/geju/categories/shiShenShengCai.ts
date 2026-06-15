import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 食神生财（放宽版，和伤官生财同口径）：
 *  1. 食神显：透干 或 月令本气。
 *  2. 财类显：透干 或 藏干 (正偏财不分)。
 *  3. 无印紧贴食神/财。
 *  4. 日主非极弱/近从弱。
 *  5. 无枭夺食 (偏印紧贴食神 且 无财护)。
 *  6. 无比劫紧贴夺财 (无官杀制)。
 */
export function isShiShenShengCai(ctx: Ctx): GejuHit | null {
  const monthMainShi = ctx.pillars.month.hideShishen[0] === '食神'
  if (!ctx.tou('食神') && !monthMainShi) return null
  const caiVisible =
    ctx.touCat('财') || ctx.zang('正财') || ctx.zang('偏财')
  if (!caiVisible) return null
  if (ctx.touCat('印')) {
    const yinAdjShi =
      ctx.adjacentTou('正印', '食神') || ctx.adjacentTou('偏印', '食神')
    const yinAdjCai =
      ctx.adjacentTou('正印', '正财') || ctx.adjacentTou('正印', '偏财') ||
      ctx.adjacentTou('偏印', '正财') || ctx.adjacentTou('偏印', '偏财')
    if (yinAdjShi || yinAdjCai) return null
  }
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  if (ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')) return null
  const bijieAdjCai =
    ctx.adjacentTou('比肩', '正财') || ctx.adjacentTou('比肩', '偏财') ||
    ctx.adjacentTou('劫财', '正财') || ctx.adjacentTou('劫财', '偏财')
  if (bijieAdjCai && !ctx.touCat('官杀')) return null
  return { name: '食神生财', note: '食神显 · 财显 · 无印紧贴阻 · 非极弱 · 无官/劫克' }
}
