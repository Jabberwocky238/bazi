import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/** 正印格（依《子平真诠·论印绶》4 条）。 */
export function isZhengYinGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '正印')) return null
  const caiAdjYin =
    ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('偏财', '正印')
  if (caiAdjYin && !ctx.touCat('比劫')) return null
  if (ctx.level === '身极旺' && !ctx.touCat('财') && !ctx.touCat('食伤')) return null
  return { name: '正印格', note: '月令正印 (本气或透根)，无紧贴财破印' }
}
