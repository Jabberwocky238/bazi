import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 伤官生财 — 身强用财, 伤官泄秀生财.
 *
 * bazi-skills 5 条 (《子平真诠·论伤官》《滴天髓·伤官》《渊海子平·伤官格》):
 *  1. 伤官透干通根 OR 月令本气           [可被岁运补: 岁运透伤官]
 *  2. 财星透干通根                       [可被岁运补: 岁运透财]
 *  3. 伤 → 财 无印阻断                   [岁运透印紧贴 → Break (近似)]
 *  4. 身强 (本格专为身旺用财)            [静态]
 *  5. 无正官紧贴伤官                     [岁运透官 → Break]
 *
 *  本 detector: 4 静态; 1、2 base + extras 双路径; 3、5 base 严判 + 岁运 Break.
 */
export function isShangGuanShengCai(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  // —— 条件 4: 静态非极弱 ——
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  // —— 条件 1: 伤官显 (透 OR 月令本气) ——
  const monthMainShang = bazi.pillars.month.hideShishen[0] === '伤官'
  const baseStruct1 = shishen.tou('伤官') || monthMainShang
  const extStruct1 = baseStruct1 || extras.tou('伤官')

  // —— 条件 2: 财显 ——
  const baseStruct2 = shishen.touCat('财') || shishen.zang('正财') || shishen.zang('偏财')
  const extStruct2 = baseStruct2 || extras.touCat('财')

  // —— 条件 3: 无印紧贴 (主局判) ——
  const yinAdjShang =
    shishen.adjacentTou('正印', '伤官') || shishen.adjacentTou('偏印', '伤官')
  const yinAdjCai =
    shishen.adjacentTou('正印', '正财') || shishen.adjacentTou('正印', '偏财') ||
    shishen.adjacentTou('偏印', '正财') || shishen.adjacentTou('偏印', '偏财')
  const baseClean3 = !shishen.touCat('印') || (!yinAdjShang && !yinAdjCai)
  const extClean3 = baseClean3 && !extras.touCat('印')   // 岁运透印 → 近似 Break

  // —— 条件 5: 无正官紧贴伤官 ——
  const baseClean5 = !(shishen.tou('正官') && shishen.adjacentTou('伤官', '正官'))
  const extClean5 = baseClean5 && !extras.tou('正官')

  const baseFormed = baseStruct1 && baseStruct2 && baseClean3 && baseClean5
  const withExtrasFormed = extStruct1 && extStruct2 && extClean3 && extClean5

  return emitGeju(
    { name: '伤官生财', note: '伤官显 · 财显 · 无印紧贴阻 · 非极弱 · 无官克伤' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
