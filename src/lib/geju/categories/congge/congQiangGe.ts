import { readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 从强格 (md)：印星力量 > 比劫 + 月令为印或比劫 + 全局皆印比 + 无食伤财官杀。
 * md 明文：「四柱印绶重重，比劫叠叠」「印星力量 > 比劫」
 *        「没有食伤财星官杀任何一党」。
 * 与从旺格差异：从旺格 比劫 ≥ 印，从强格 印 > 比劫。
 */
export function isCongQiangGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  if (!strength.deLing) return null
  const yinN = shishen.countCat('印')
  const biN = shishen.countCat('比劫')
  if (yinN <= biN) return null
  if (yinN + biN < 5) return null
  if (shishen.countCat('食伤') > 0) return null
  if (shishen.countCat('财') > 0) return null
  if (shishen.countCat('官杀') > 0) return null
  return { name: '从强格', note: `印 ${yinN} > 比劫 ${biN} 主导，全局皆印比` }
}
