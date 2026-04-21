import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 天元一气 —— md：「年月日时四柱之干同为一字」。 */
export function isTianYuanYiQi(ctx: Ctx): GejuHit | null {
  const g = ctx.pillars.year.gan
  if (!g) return null
  if (!ctx.mainArr.every((p) => p.gan === g)) return null
  return { name: '天元一气', note: `四柱天干同为 ${g}` }
}
