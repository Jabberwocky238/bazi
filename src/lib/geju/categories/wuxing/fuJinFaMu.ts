import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 斧斤伐木：木日主 + 木有根 + 金透根适度 + 水/土不过多。 */
export function isFuJinFaMu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  if (!ctx.rootWx('木')) return null
  const jinGanN = ctx.ganWxCount('金')
  const jinZhiN = ctx.zhiMainWxCount('金')
  if (jinGanN === 0 && jinZhiN === 0) return null
  if (jinGanN + jinZhiN > 3) return null
  if (!ctx.touWx('金')) return null
  if (ctx.ganWxCount('水') + ctx.zhiMainWxCount('水') >= 3) return null
  if (ctx.ganWxCount('土') + ctx.zhiMainWxCount('土') >= 3) return null
  return { name: '斧斤伐木', note: '木有根 · 金透根适度 · 金木对立成象' }
}
