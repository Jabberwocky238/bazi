import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/** 从革格：庚辛金日主专旺。 */
export function isCongGeGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '金')
  return r ? { name: '从革格', note: r.note } : null
}
