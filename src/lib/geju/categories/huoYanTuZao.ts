import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/** 火炎土燥：火土皆透 + 火过旺 + 无水。 */
export function isHuoYanTuZao(ctx: Ctx): GejuHit | null {
  if (!ctx.touWx('火') || !ctx.touWx('土')) return null
  const huoHeavy = ctx.ganWxCount('火') >= 2 || ctx.zhiMainWxCount('火') >= 2
  if (!huoHeavy) return null
  if (ctx.touWx('水') || ctx.rootWx('水')) return null
  return { name: '火炎土燥', note: '火旺透土而无水润' }
}
