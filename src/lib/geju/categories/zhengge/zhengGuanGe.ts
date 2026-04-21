import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 正官格（依《子平真诠·论正官》5 条）：
 */
export function isZhengGuanGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '正官')) return null
  if (!ctx.tou('正官')) return null
  if (!ctx.zang('正官')) return null
  if (ctx.tou('七杀')) return null
  if (ctx.tou('伤官') && ctx.adjacentTou('伤官', '正官') && !ctx.touCat('印')) return null
  if (ctx.shenRuo) return null
  return { name: '正官格', note: '月令正官透根，不混杀无伤紧贴，身可任' }
}
