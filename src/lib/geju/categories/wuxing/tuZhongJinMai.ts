import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

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
