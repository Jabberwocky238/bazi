import { readBazi, readShishen } from '../../hooks'
import { WX_CONTROLLED_BY } from '../../types'
import type { GejuHit } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从官格（依 md 7 条）：
 *  1. 极弱无根。
 *  2. 月令为正官 (本气)。
 *  3. 正官 ≥ 财 && > 食伤；不混七杀。
 *  4. 无食伤。
 *  5. 无印。
 *  6. 无比劫。
 */
export function isCongGuanGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  if (shishen.countCat('比劫') > 0) return null
  if (shishen.countCat('印') > 0) return null
  if (shishen.countCat('食伤') > 0) return null
  if (!shishen.tou('正官')) return null
  if (shishen.tou('七杀')) return null
  // md 条件 2: 月令本气正官 (或 monthCat === '官杀' 配合透正官)
  if (bazi.monthCat !== '官杀') return null
  // md 条件 3: 正官数量 ≥ 财
  if (shishen.countOf('正官') < shishen.countCat('财')) return null
  const gwWx = WX_CONTROLLED_BY[bazi.dayWx] as WuXing
  if (bazi.zhiMainWxCount(gwWx) < 2) return null
  return { name: '从官格', note: `无比印食伤，月令正官通根 ${gwWx} ≥ 2 位` }
}
