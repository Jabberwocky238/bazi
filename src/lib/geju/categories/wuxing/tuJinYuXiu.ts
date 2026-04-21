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
