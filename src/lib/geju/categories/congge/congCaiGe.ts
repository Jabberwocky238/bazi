import { WX_CONTROLS, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkCong } from './_check'

/** 弃命从财 —— md：「财星数量 ≥ 食伤」「财星数量 > 官杀」+ 财总量占绝对主导 (≥ 5 位)。 */
export function isCongCaiGe(ctx: Ctx): GejuHit | null {
  const caiWx = WX_CONTROLS[ctx.dayWx]
  const r = checkCong(ctx, '财', caiWx)
  if (!r) return null
  const caiN = ctx.countCat('财')
  // 真从必须财星极盛 (总量 ≥ 5 位)
  if (caiN < 5) return null
  if (caiN < ctx.countCat('食伤')) return null
  if (caiN <= ctx.countCat('官杀')) return null
  return { name: '弃命从财', note: `${r.note}，财 ${caiN} 位主导` }
}
