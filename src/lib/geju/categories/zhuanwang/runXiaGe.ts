import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/** 润下格：壬癸水日主专旺。 */
export function isRunXiaGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '水')
  return r ? { name: '润下格', note: r.note } : null
}
