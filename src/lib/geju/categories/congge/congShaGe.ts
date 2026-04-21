import { WX_CONTROLLED_BY, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkCong } from './_check'

/** 弃命从煞 —— md：「官杀数量 ≥ 财星」「官杀数量 > 食伤」+ 「无食伤克官杀」。 */
export function isCongShaGe(ctx: Ctx): GejuHit | null {
  const ksWx = WX_CONTROLLED_BY[ctx.dayWx]
  const r = checkCong(ctx, '官杀', ksWx)
  if (!r) return null
  if (ctx.countCat('官杀') < ctx.countCat('财')) return null
  if (ctx.countCat('官杀') <= ctx.countCat('食伤')) return null
  if (ctx.touCat('食伤')) return null
  return { name: '弃命从煞', note: r.note }
}
