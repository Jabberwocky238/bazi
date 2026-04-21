import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/** 正财格（依 md 四条）。 */
export function isZhengCaiGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '正财')) return null
  if (!ctx.tou('正财')) return null
  if (!ctx.zang('正财')) return null
  if (ctx.shenRuo) return null
  const bijieAdjCai =
    ctx.adjacentTou('劫财', '正财') || ctx.adjacentTou('比肩', '正财')
  if (bijieAdjCai && !ctx.touCat('官杀')) return null
  return { name: '正财格', note: '月令正财透根，身可任，比劫紧贴有官杀制' }
}
