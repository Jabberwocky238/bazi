import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 金火铸印：金日主 + 金有根 + 火透坐根且不过旺。 */
export function isJinHuoZhuYin(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  if (!ctx.rootWx('金')) return null
  if (!ctx.touWx('火') || !ctx.rootWx('火')) return null
  if (ctx.ganWxCount('火') >= 3) return null
  return { name: '金火铸印', note: '金有根 · 火透坐根不过旺 · 得火锻炼' }
}
