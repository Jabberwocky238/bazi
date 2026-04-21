import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 金寒水冷：冬月 + (日主金或水) + 金水齐透 + 无火透。 */
export function isJinHanShuiLeng(ctx: Ctx): GejuHit | null {
  if (ctx.season !== '冬') return null
  if (ctx.dayWx !== '金' && ctx.dayWx !== '水') return null
  if (!ctx.touWx('金') || !ctx.touWx('水')) return null
  if (ctx.touWx('火')) return null
  return { name: '金寒水冷', note: '冬月金水并透，火缺调候' }
}
