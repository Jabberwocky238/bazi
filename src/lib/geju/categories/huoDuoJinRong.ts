import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/** 火多金熔（放宽版）：金日主 + 火盛 + 金虚 + 无有力水/土救。 */
export function isHuoDuoJinRong(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  // 火盛：天干≥2 或 地支本气≥2 (原来要求两个都满足，过严)
  const huoHeavy = ctx.ganWxCount('火') >= 2 || ctx.zhiMainWxCount('火') >= 2
  if (!huoHeavy) return null
  // 金虚：无本气根 + 天干不过一位
  if (ctx.rootWx('金')) return null
  if (ctx.ganWxCount('金') >= 2) return null
  // 水救：水透+根 才算
  if (ctx.touWx('水') && ctx.rootWx('水')) return null
  // 土救：土透+根 才算
  if (ctx.touWx('土') && ctx.rootWx('土')) return null
  return { name: '火多金熔', note: '火盛金虚 · 无有力水/土救' }
}
