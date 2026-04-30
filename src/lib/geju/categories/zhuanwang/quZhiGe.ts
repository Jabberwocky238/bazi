import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/** 曲直格：甲乙木日主专旺。 */
export function isQuZhiGe(): GejuHit | null {
  const r = checkZhuanWang('木')
  return r ? { name: '曲直格', note: r.note } : null
}
