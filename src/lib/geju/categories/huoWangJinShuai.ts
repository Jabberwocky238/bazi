import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/** 火旺金衰：金日主 + 火透≥2 + 金无根 + 无土通关。 */
export function isHuoWangJinShuai(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  if (ctx.ganWxCount('火') < 2) return null
  if (ctx.rootWx('金')) return null
  if (ctx.touWx('土')) return null
  // 互斥：火多金熔 更严重时让位
  const huoHeavy = ctx.ganWxCount('火') >= 2 && ctx.zhiMainWxCount('火') >= 1
  if (huoHeavy && !(ctx.touWx('水') || ctx.rootWx('水')) && ctx.ganWxCount('金') < 2) return null
  return { name: '火旺金衰', note: '火多透 · 金无根 · 无土通关' }
}
