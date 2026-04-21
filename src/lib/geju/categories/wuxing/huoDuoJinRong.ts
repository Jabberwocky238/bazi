import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 火多金熔：金日主 + 火极盛 + 金无根 + 无水无土无金比劫救。 */
export function isHuoDuoJinRong(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  const huoHeavy = ctx.ganWxCount('火') >= 2 && ctx.zhiMainWxCount('火') >= 1
  if (!huoHeavy) return null
  if (ctx.rootWx('金')) return null
  if (ctx.touWx('水') || ctx.rootWx('水')) return null
  if (ctx.touWx('土')) return null
  if (ctx.ganWxCount('金') >= 2) return null
  return { name: '火多金熔', note: '火极盛 · 金无根无水无土无比劫救' }
}
