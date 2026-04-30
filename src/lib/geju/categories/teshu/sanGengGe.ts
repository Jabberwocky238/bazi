import { readBazi, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 三庚格 —— md：「天干四位中至少三位为庚金」+ 「庚金为日主喜用」。
 *   庚金为用 = 日主为甲乙木 (庚为官杀 需有根以任官) 或 丙丁火 (庚为财)；
 *   日主为庚辛金 (庚为比劫) → md 明文: 「庚金为忌神 → 破格」。
 */
export function isSanGengGe(): GejuHit | null {
  const bazi = readBazi()
  const strength = readStrength()
  const gengN = bazi.mainArr.filter((p) => p.gan === '庚').length
  if (gengN < 3) return null
  if (bazi.dayWx === '金') return null
  if (bazi.dayWx === '木' && strength.shenRuo) return null
  return { name: '三庚格', note: `天干庚 ${gengN} 位 · 日主${bazi.dayGan}为用` }
}
