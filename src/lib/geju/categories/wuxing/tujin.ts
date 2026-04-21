import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 土金毓秀：土日主 + 金透通根 + 土有根 + 无木透 + 火 < 2。 */
export function isTuJinYuXiu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  if (!ctx.touWx('金') || !ctx.rootWx('金')) return null
  if (!ctx.rootWx('土')) return null
  if (ctx.touWx('木')) return null
  if (ctx.ganWxCount('火') >= 2) return null
  return { name: '土金毓秀', note: '土厚金透通根，无木克土无重火克金' }
}

/** 土重金埋：金日主 + 地支土≥3 + 土透≥2 + 金无根 + 无木救 + 无水救。 */
export function isTuZhongJinMai(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  if (ctx.zhiMainWxCount('土') < 3) return null
  if (ctx.ganWxCount('土') < 2) return null
  if (ctx.rootWx('金')) return null
  if (ctx.touWx('木')) return null
  if (ctx.touWx('水') || ctx.rootWx('水')) return null
  return { name: '土重金埋', note: '土 ≥ 3 位压金 · 金虚无根 · 无木水救' }
}
