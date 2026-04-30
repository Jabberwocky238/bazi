import { readBazi, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 身杀两停（收紧版）：
 *  1. 日主身旺 且 本气/中气有根 (有扶)。
 *  2. 七杀天干透 + 地支通根。
 *  3. 七杀数量 ≥ 2 (否则只是"杀微")。
 *  4. 无正官混杂。
 */
export function isShenShaLiangTing(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  if (!strength.shenWang) return null
  if (!bazi.rootExt(bazi.dayWx)) return null
  if (!shishen.tou('七杀')) return null
  if (!shishen.zang('七杀')) return null
  if (shishen.countCat('官杀') < 3) return null
  if (shishen.tou('正官')) return null
  return { name: '身杀两停', note: '身旺有根 · 七杀透根数≥2 · 官杀不混' }
}
