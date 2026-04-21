import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/** 曲直格：甲乙木日主专旺。 */
export function isQuZhiGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '木')
  return r ? { name: '曲直格', note: r.note } : null
}
