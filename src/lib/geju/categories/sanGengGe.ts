import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 三庚格 —— md：「天干四位中至少三位为庚金」+ 「庚金为日主喜用」。
 *   庚金为用 = 日主为甲乙木 (庚为官杀 需有根以任官) 或 丙丁火 (庚为财)；
 *   日主为庚辛金 (庚为比劫) → md 明文: 「庚金为忌神 → 破格」。
 */
export function isSanGengGe(ctx: Ctx): GejuHit | null {
  const gengN = ctx.mainArr.filter((p) => p.gan === '庚').length
  if (gengN < 3) return null
  if (ctx.dayWx === '金') return null
  if (ctx.dayWx === '木' && ctx.shenRuo) return null
  return { name: '三庚格', note: `天干庚 ${gengN} 位 · 日主${ctx.dayGan}为用` }
}
