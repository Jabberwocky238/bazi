import { readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 从旺格（依 md 4 条 + 亚型区分）：
 *  1. 比劫 + 印主导，月令本气为比印，总位 ≥ 5 (条件 1)。
 *  2. 无官杀 (条件 2)。
 *  3. 财星不紧贴印 (条件 3，紧贴才破)。
 *  4. 食伤 ≤ 1 位 (条件 4，多则重泄破)。
 *  5. 比劫 ≥ 印（与从强格区分）。
 */
export function isCongWangGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  if (!strength.deLing) return null
  const support = shishen.countCat('比劫') + shishen.countCat('印')
  if (support < 5) return null
  if (shishen.countCat('官杀') > 0) return null
  // md 条件 3: 财紧贴印破 (其余远离可容)
  const caiAdjYin =
    shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('正财', '偏印') ||
    shishen.adjacentTou('偏财', '正印') || shishen.adjacentTou('偏财', '偏印')
  if (caiAdjYin) return null
  // md 条件 4: 食伤不重泄
  if (shishen.countCat('食伤') > 1) return null
  // md 条件 5: 从旺（比劫 ≥ 印）—— 印多反为从强
  if (shishen.countCat('比劫') < shishen.countCat('印')) return null
  return {
    name: '从旺格',
    note: `比印合 ${support} 位主导，比劫 ≥ 印，无官杀无紧贴财破`,
  }
}
