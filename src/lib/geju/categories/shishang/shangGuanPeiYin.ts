import { readBazi, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 伤官佩印（依 md 5 条）：
 *  1. 伤官透干通根 OR 月令本气。
 *  2. 印透干通根，力不弱于伤官。
 *  3. 身弱。
 *  4. 无财**紧贴**克印。
 *  5. 无正官透。
 */
export function isShangGuanPeiYin(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const monthMainShang = bazi.pillars.month.hideShishen[0] === '伤官'
  const shangTouRoot = shishen.tou('伤官') && shishen.zang('伤官')
  if (!monthMainShang && !shangTouRoot) return null
  if (!shishen.tou('伤官')) return null
  // md 条件 2: 印透通根
  if (!shishen.touCat('印')) return null
  if (!(shishen.zang('正印') || shishen.zang('偏印'))) return null
  // md 条件 3: 身弱
  if (!strength.shenRuo) return null
  // md 条件 4: 财紧贴印才破
  const caiAdjYin =
    shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('正财', '偏印') ||
    shishen.adjacentTou('偏财', '正印') || shishen.adjacentTou('偏财', '偏印')
  if (caiAdjYin) return null
  // md 条件 5: 无正官透
  if (shishen.tou('正官')) return null
  return { name: '伤官佩印', note: '身弱 · 伤印双透根 · 无紧贴财破印 · 无正官透' }
}
