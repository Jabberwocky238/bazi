import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 水冷木寒：木日主 + 冬 + 水多 + 无火 + 无土。 */
export function isShuiLengMuHan(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.season !== '冬') return null
  if (ctx.ganWxCount('水') < 2 && ctx.zhiMainWxCount('水') < 2) return null
  if (ctx.touWx('火')) return null
  if (ctx.touWx('土')) return null
  return { name: '水冷木寒', note: '冬月水旺 · 无火调候 · 无土制水' }
}
