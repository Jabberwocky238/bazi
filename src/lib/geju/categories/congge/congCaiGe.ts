import { WX_CONTROLS, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkCong } from './_check'

/** 弃命从财 —— md：「财星数量 ≥ 食伤」「财星数量 > 官杀」。 */
export function isCongCaiGe(ctx: Ctx): GejuHit | null {
  const caiWx = WX_CONTROLS[ctx.dayWx]
  const r = checkCong(ctx, '财', caiWx)
  if (!r) return null
  if (ctx.countCat('财') < ctx.countCat('食伤')) return null
  if (ctx.countCat('财') <= ctx.countCat('官杀')) return null
  return { name: '弃命从财', note: r.note }
}
