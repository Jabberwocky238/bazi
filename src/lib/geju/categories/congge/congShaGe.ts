import { WX_CONTROLLED_BY, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkCong } from './_check'

/** 弃命从煞 —— md：「官杀数量 ≥ 财星」「官杀数量 > 食伤」+ 「无食伤克官杀」+ 官杀 ≥ 5 位。 */
export function isCongShaGe(ctx: Ctx): GejuHit | null {
  const ksWx = WX_CONTROLLED_BY[ctx.dayWx]
  const r = checkCong(ctx, '官杀', ksWx)
  if (!r) return null
  const gsN = ctx.countCat('官杀')
  if (gsN < 5) return null
  if (gsN < ctx.countCat('财')) return null
  if (gsN <= ctx.countCat('食伤')) return null
  if (ctx.touCat('食伤')) return null
  return { name: '弃命从煞', note: `${r.note}，官杀 ${gsN} 位主导` }
}
