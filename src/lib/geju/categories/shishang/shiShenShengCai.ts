import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 食神生财 — 食神泄秀生财, 身能任.
 *
 * bazi-skills 6 条 (《子平真诠·论食神》《滴天髓·通神论》):
 *  1. 食神透干通根 OR 月令本气                  [可被岁运补: 岁运透食神]
 *  2. 财星透干通根                              [可被岁运补: 岁运透财]
 *  3. 食 → 财 无印阻断                          [岁运透印 → Break (近似)]
 *  4. 身不过弱 (能任食 + 财双重泄耗)           [静态]
 *  5. 无偏印紧贴夺食 (除非财救)                [岁运透偏印 + 无财救 → Break]
 *  6. 无比劫紧贴夺财 (除非官杀制)              [岁运透比劫 + 无官杀 → Break]
 */
export function isShiShenShengCai(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  // —— 条件 4: 静态非极弱 ——
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  // —— 条件 1: 食神显 ——
  const monthMainShi = bazi.pillars.month.hideShishen[0] === '食神'
  const baseStruct1 = shishen.tou('食神') || monthMainShi
  const extStruct1 = baseStruct1 || extras.tou('食神')

  // —— 条件 2: 财显 ——
  const baseStruct2 = shishen.touCat('财') || shishen.zang('正财') || shishen.zang('偏财')
  const extStruct2 = baseStruct2 || extras.touCat('财')

  // —— 条件 3: 无印紧贴阻断 ——
  const yinAdjShi =
    shishen.adjacentTou('正印', '食神') || shishen.adjacentTou('偏印', '食神')
  const yinAdjCai =
    shishen.adjacentTou('正印', '正财') || shishen.adjacentTou('正印', '偏财') ||
    shishen.adjacentTou('偏印', '正财') || shishen.adjacentTou('偏印', '偏财')
  const baseClean3 = !shishen.touCat('印') || (!yinAdjShi && !yinAdjCai)
  const extClean3 = baseClean3 && !extras.touCat('印')

  // —— 条件 5: 无枭夺食 ——
  const baseClean5 = !(
    shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')
  )
  const extClean5 = baseClean5 && !(
    extras.tou('偏印') && !shishen.touCat('财') && !extras.touCat('财')
  )

  // —— 条件 6: 无比劫夺财 ——
  const bijieAdjCai =
    shishen.adjacentTou('比肩', '正财') || shishen.adjacentTou('比肩', '偏财') ||
    shishen.adjacentTou('劫财', '正财') || shishen.adjacentTou('劫财', '偏财')
  const baseClean6 = !(bijieAdjCai && !shishen.touCat('官杀'))
  const extClean6 = baseClean6 && !(
    extras.touCat('比劫') && !shishen.touCat('官杀') && !extras.touCat('官杀')
  )

  const baseFormed = baseStruct1 && baseStruct2 && baseClean3 && baseClean5 && baseClean6
  const withExtrasFormed = extStruct1 && extStruct2 && extClean3 && extClean5 && extClean6

  return emitGeju(
    { name: '食神生财', note: '食神显 · 财显 · 无印紧贴阻 · 非极弱 · 无官/劫克' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
