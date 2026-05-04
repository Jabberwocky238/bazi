import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 伤官佩印 — 身弱用印, 印克伤官并生身.
 *
 * bazi-skills 5 条 (《子平真诠·论伤官》《滴天髓·伤官》《渊海子平·伤官诗诀》):
 *  1. 伤官透干通根 OR 月令本气                  [可被岁运补: 岁运透伤官]
 *  2. 印透干通根, 印 ≥ 伤                       [可被岁运补: 岁运透印]
 *  3. 身弱 (本格专为身弱用印)                   [静态]
 *  4. 无财紧贴克印                              [岁运透财 → Break (近似)]
 *  5. 无正官透干 (一点不见方妙)                 [岁运透官 → Break]
 *
 *  本 detector: 3 静态; 1、2 base + extras 双路径; 4、5 base 严判 + 岁运 Break.
 */
export function isShangGuanPeiYin(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  // —— 条件 3: 身弱 ——
  if (!strength.shenRuo) return null

  // —— 条件 1: 伤官显 ——
  const monthMainShang = bazi.pillars.month.hideShishen[0] === '伤官'
  const shangTouRoot = shishen.tou('伤官') && shishen.zang('伤官')
  const baseStruct1 = (monthMainShang || shangTouRoot) && shishen.tou('伤官')
  const extStruct1 = baseStruct1 || ((monthMainShang || shangTouRoot) && extras.tou('伤官'))

  // —— 条件 2: 印透 + 通根 ——
  const baseStruct2 = shishen.touCat('印') && (shishen.zang('正印') || shishen.zang('偏印'))
  const extStruct2 = baseStruct2 ||
    (extras.touCat('印') && (shishen.has('正印') || shishen.has('偏印')))

  // —— 条件 4: 无财紧贴印 ——
  const caiAdjYin =
    shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('正财', '偏印') ||
    shishen.adjacentTou('偏财', '正印') || shishen.adjacentTou('偏财', '偏印')
  const baseClean4 = !caiAdjYin
  const extClean4 = baseClean4 && !extras.touCat('财')

  // —— 条件 5: 无正官透 ——
  const baseClean5 = !shishen.tou('正官')
  const extClean5 = baseClean5 && !extras.tou('正官')

  const baseFormed = baseStruct1 && baseStruct2 && baseClean4 && baseClean5
  const withExtrasFormed = extStruct1 && extStruct2 && extClean4 && extClean5

  return emitGeju(
    { name: '伤官佩印', note: '身弱 · 伤印双透根 · 无紧贴财破印 · 无正官透' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
