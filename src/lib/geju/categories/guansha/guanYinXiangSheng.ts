import { readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 官印相生 — 正官透干通根 + 印星透干通根 + 官印紧贴 + 身能任。
 *
 * bazi-skills 5 条 (《子平真诠·论正官》《滴天髓·官杀》《渊海子平》):
 *  1. 正官透干通根，不混杂七杀 — 主局紧贴位置 [静态/可破: 岁运透七杀 → Break]
 *  2. 印透干通根，位于官与日主之间 — 紧贴通关 [静态: 岁运不在主局序位, 不补]
 *  3. 无财紧贴克印 [岁运透财 → Break (近似)]
 *  4. 日主非极弱 [由 strength 静态判定]
 *  5. 无伤官紧贴克正官 [岁运透伤官 → Break]
 *
 *  本 detector 实现: 主局结构性条件 (1/2/4) 严判, 岁运层只判 Break。
 *  岁运无法补 "紧贴位置"——主局缺紧贴即 null。
 */
export function isGuanYinXiangSheng(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  // —— 主局结构性必要条件 ——
  if (!shishen.tou('正官')) return null
  if (!shishen.zang('正官')) return null
  if (!shishen.touCat('印')) return null
  if (!(shishen.zang('正印') || shishen.zang('偏印'))) return null
  const adjOfficial =
    shishen.adjacentTou('正官', '正印') || shishen.adjacentTou('正官', '偏印')
  if (!adjOfficial) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  // —— 主局清纯 (条件 1 不混杂、3 无财贴印、5 无伤官贴官) ——
  const baseClean1 = !shishen.tou('七杀')
  const baseClean3 = !(
    shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('正财', '偏印') ||
    shishen.adjacentTou('偏财', '正印') || shishen.adjacentTou('偏财', '偏印')
  )
  const baseClean5 = !(
    shishen.tou('伤官') && shishen.adjacentTou('伤官', '正官') && !shishen.touCat('印')
  )
  const baseFormed = baseClean1 && baseClean3 && baseClean5

  // —— 岁运 Break ——
  const extraBreak1 = extras.tou('七杀')           // 岁运透杀 → 混杂
  const extraBreak3 = extras.touCat('财')          // 岁运透财 → 近似破印 (紧贴未严判)
  const extraBreak5 = extras.tou('伤官') && !shishen.touCat('印') && !extras.touCat('印')
  const withExtrasFormed = baseFormed && !extraBreak1 && !extraBreak3 && !extraBreak5

  return emitGeju(
    { name: '官印相生', note: '正官印双透通根紧贴，身可任，无紧贴财/伤破局' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
