import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/** 火土夹带：火土皆透有根 + 有水调湿。 */
export function isHuoTuJiaDai(ctx: Ctx): GejuHit | null {
  if (!ctx.touWx('火') || !ctx.touWx('土')) return null
  const huoHeavy = ctx.ganWxCount('火') >= 2 || ctx.zhiMainWxCount('火') >= 2
  const hasShui = ctx.touWx('水') || ctx.rootWx('水')
  if (huoHeavy && !hasShui) return null                      // 让位火炎土燥
  if (!ctx.rootWx('火') || !ctx.rootWx('土') || !hasShui) return null
  return { name: '火土夹带', note: '火土相连有根且水润' }
}
