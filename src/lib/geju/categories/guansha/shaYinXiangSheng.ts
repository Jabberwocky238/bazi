import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 杀印相生 — 七杀透干通根 + 印星紧贴化杀生身。
 *
 * bazi-skills 5 条 (《子平真诠·论七杀》《滴天髓·官杀》):
 *  1. 七杀透干通根 OR 月令本气七杀 [可被岁运补: 主局七杀仅藏 + 岁运透杀 → Trigger]
 *  2. 印星透干通根 [可被岁运补: 岁运透印]
 *  3. 七杀→印→日主 紧贴通关 [静态/位置: 不补]
 *  4. 无财紧贴克印 [岁运透财 → Break]
 *  5. 日主非极弱 [静态]
 *
 *  互斥: 伤官合杀成立 (阴日伤官七杀紧贴双透) → 杀已合去, 不再相生。
 *
 *  本 detector 实现:
 *    - 条件 1 / 2 用 baseStruct (主局严判) + extraStruct (岁运补缺) 双路径
 *    - 条件 3 / 5 静态严判, 主局缺即 null
 *    - 条件 4 用 base 紧贴判 + 岁运透财 Break
 *
 *  emitGeju 装配:
 *    主局成 + 岁运不破 → 显
 *    主局成 + 岁运透财 → 显 + Break
 *    主局缺 (1 或 2) + 岁运补 → 隐 + Trigger
 */
export function isShaYinXiangSheng(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  // —— 静态前提: 条件 3 (印紧贴日主) + 条件 5 (非极弱) + 互斥 (伤官合杀) ——
  const yinAdjRi =
    bazi.pillars.month.shishen === '正印' || bazi.pillars.month.shishen === '偏印' ||
    bazi.pillars.hour.shishen === '正印' || bazi.pillars.hour.shishen === '偏印'
  if (!yinAdjRi) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null
  if (!bazi.dayYang && shishen.tou('伤官') && shishen.tou('七杀') &&
      shishen.adjacentTou('伤官', '七杀')) return null

  // —— 条件 1: 七杀显 (月令本气 / 透 / 透+紧贴印) ——
  const monthMainSha = bazi.pillars.month.hideShishen[0] === '七杀'
  const baseSha = monthMainSha || shishen.tou('七杀') || shishen.zang('七杀')
  const shaTouAdj = shishen.tou('七杀')
    ? shishen.adjacentTou('七杀', '正印') || shishen.adjacentTou('七杀', '偏印')
    : true   // 七杀仅藏支或月令本气, 不要求紧贴 (因主气位无紧贴概念)
  const baseStruct1 = baseSha && shaTouAdj

  const withSha = baseSha || extras.has('七杀')
  const withShaAdj = shaTouAdj || (!shishen.tou('七杀') && extras.tou('七杀'))
  const extStruct1 = withSha && withShaAdj

  // —— 条件 2: 印透 + 通根 ——
  const baseStruct2 = shishen.touCat('印') && (shishen.zang('正印') || shishen.zang('偏印'))
  const extStruct2 = baseStruct2 || (extras.touCat('印') && (shishen.has('正印') || shishen.has('偏印')))

  // —— 条件 4 + 混杂: 主局清纯 ——
  const baseClean = !shishen.tou('正官') && !(
    shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('正财', '偏印') ||
    shishen.adjacentTou('偏财', '正印') || shishen.adjacentTou('偏财', '偏印')
  )
  const extraClean = baseClean && !extras.tou('正官') && !extras.touCat('财')

  const baseFormed = baseStruct1 && baseStruct2 && baseClean
  const withExtrasFormed = extStruct1 && extStruct2 && extraClean

  return emitGeju(
    { name: '杀印相生', note: '七杀透根 · 印紧贴日主化杀 · 无财破无极弱' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
