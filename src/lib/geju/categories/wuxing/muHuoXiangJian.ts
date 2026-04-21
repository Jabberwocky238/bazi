import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 木火相煎：木日主 + 火过旺 + 木根虚 + 无水。 */
export function isMuHuoXiangJian(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  const huoMany = ctx.ganWxCount('火') >= 2 || ctx.zhiMainWxCount('火') >= 2
  if (!huoMany) return null
  if (ctx.zhiMainWxCount('木') > 1) return null
  if (ctx.touWx('水') || ctx.rootWx('水')) return null
  return { name: '木火相煎', note: '火过旺而木根虚，无水润' }
}
