import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/** 偏财格（依 md 四条；身强要求比正财宽松）。 */
export function isPianCaiGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '偏财')) return null
  const isExtremelyWeak = ctx.level === '身极弱' || ctx.level === '近从弱'
  if (isExtremelyWeak && ctx.countCat('比劫') + ctx.countCat('印') === 0) return null
  const bijieAdjCai =
    ctx.adjacentTou('劫财', '偏财') || ctx.adjacentTou('比肩', '偏财')
  if (bijieAdjCai && !ctx.touCat('食伤') && !ctx.touCat('官杀')) return null
  return { name: '偏财格', note: '月令偏财 (本气或透根)，身可担，比劫紧贴有食伤/官杀化' }
}
