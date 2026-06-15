import { WX_CONTROLS, type Ctx } from '../types'
import type { GejuHit } from '../types'
import { checkCong } from './congge/_check'

/** 弃命从财（从弱派）：财类数量 ≥ 食伤 且 ≥ 3 位。 */
export function isCongCaiGe(ctx: Ctx): GejuHit | null {
  const caiWx = WX_CONTROLS[ctx.dayWx]
  const r = checkCong(ctx, '财', caiWx)
  if (!r) return null
  const caiN = ctx.countCat('财')
  if (caiN < 3) return null
  if (caiN < ctx.countCat('食伤')) return null
  return { name: '弃命从财', note: `${r.note}，财 ${caiN} 位` }
}
