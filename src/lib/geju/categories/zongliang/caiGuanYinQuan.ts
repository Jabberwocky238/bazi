import { readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 财官印全 (三奇得位) — 财、官、印三者透根 + 链条顺流。
 *
 * bazi-skills 5 条 (《子平真诠·论财》《三命通会·论财官印绶》《滴天髓·通神论》):
 *  1. 财、官 (或杀)、印三者均透干通根            [静态: 主局结构]
 *  2. 依次相生顺流 (财 → 官 → 印 → 日主)          [静态/位置]
 *  3. 官杀不混                                    [岁运透官杀另一方 → Break]
 *  4. 无伤官克官、无比劫夺财                      [岁运透伤官 / 比劫 → Break]
 *  5. 日主非极弱                                  [静态]
 *
 *  本 detector: 1、2 主局严判 (extras 难补结构); 3、4 base + 岁运 Break.
 */
export function isCaiGuanYinQuan(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const caiTouRoot =
    (shishen.tou('正财') && shishen.zang('正财')) ||
    (shishen.tou('偏财') && shishen.zang('偏财'))
  const guanTouRoot =
    (shishen.tou('正官') && shishen.zang('正官')) ||
    (shishen.tou('七杀') && shishen.zang('七杀'))
  const yinTouRoot =
    (shishen.tou('正印') && shishen.zang('正印')) ||
    (shishen.tou('偏印') && shishen.zang('偏印'))
  if (!caiTouRoot || !guanTouRoot || !yinTouRoot) return null

  const baseClean3 = !(shishen.tou('正官') && shishen.tou('七杀'))
  const baseClean4a = !(shishen.tou('伤官') && shishen.adjacentTou('伤官', '正官'))
  const bijieAdjCai =
    shishen.adjacentTou('比肩', '正财') || shishen.adjacentTou('比肩', '偏财') ||
    shishen.adjacentTou('劫财', '正财') || shishen.adjacentTou('劫财', '偏财')
  const baseClean4b = !bijieAdjCai
  const baseFormed = baseClean3 && baseClean4a && baseClean4b

  // 岁运 Break: 透官杀另一方混杂 / 透伤官 / 透比劫
  const guanMain = shishen.tou('正官')
  const shaMain = shishen.tou('七杀')
  const extClean3 = baseClean3 &&
    !(guanMain && extras.tou('七杀')) &&
    !(shaMain && extras.tou('正官'))
  const extClean4a = baseClean4a && !extras.tou('伤官')
  const extClean4b = baseClean4b && !extras.touCat('比劫')
  const withExtrasFormed = extClean3 && extClean4a && extClean4b

  return emitGeju(
    { name: '财官印全', note: '财官印三者透根、清纯无紧贴破' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
