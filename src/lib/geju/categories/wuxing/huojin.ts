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

/** 金火铸印：金日主 + 金有根 + 火透坐根且不过旺。 */
export function isJinHuoZhuYin(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  if (!ctx.rootWx('金')) return null
  if (!ctx.touWx('火') || !ctx.rootWx('火')) return null
  if (ctx.ganWxCount('火') >= 3) return null
  return { name: '金火铸印', note: '金有根 · 火透坐根不过旺 · 得火锻炼' }
}
