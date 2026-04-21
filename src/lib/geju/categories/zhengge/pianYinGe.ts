import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/** 偏印格（依《子平真诠·论偏印》5 条）。 */
export function isPianYinGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '偏印')) return null
  if (!ctx.tou('偏印')) return null
  if (!ctx.zang('偏印')) return null
  const xiao = ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')
  if (xiao) return null
  const ganCount = ctx.mainArr.filter((p) => p.shishen === '偏印').length
  const mainCount = ctx.mainAt('偏印').length
  if (ganCount + mainCount > 2) return null
  if (ctx.level === '身极旺') return null
  return { name: '偏印格', note: '月令偏印透根，量不过重，食神有护' }
}
