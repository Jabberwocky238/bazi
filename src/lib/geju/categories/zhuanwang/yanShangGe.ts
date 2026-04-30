import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/** 炎上格：丙丁火日主专旺。 */
export function isYanShangGe(): GejuHit | null {
  const r = checkZhuanWang('火')
  return r ? { name: '炎上格', note: r.note } : null
}
