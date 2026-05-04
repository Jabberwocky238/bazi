import { readBazi, readExtras, readShishen } from '../../hooks'
import { YANG_REN } from '../../types'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 阳刃格 — md 全部铁律 + 岁运:
 *  ① 月支 === 日干刃位。
 *  ② 必有官杀制刃 (主局 OR 岁运透官杀)。
 *  ③ 伤官紧贴正官且无印 → 破 (主局 / 岁运皆判)。
 */
export function isYangRenGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()
  if (bazi.monthZhi !== YANG_REN[bazi.dayGan]) return null

  const baseGuanSha = shishen.touCat('官杀')
  const extrasGuanSha = baseGuanSha || extras.touCat('官杀')

  const breakBy = (touOrExtras: '正官' | '七杀' | '伤官', extrasFlag: boolean) =>
    shishen.tou(touOrExtras) || (extrasFlag && extras.tou(touOrExtras))
  const breakBase =
    shishen.tou('正官') && !shishen.tou('七杀') && shishen.tou('伤官') && !shishen.touCat('印')
  const breakWithExtras =
    breakBy('正官', true) && !breakBy('七杀', true) && breakBy('伤官', true)
    && !(shishen.touCat('印') || extras.touCat('印'))

  const baseFormed = baseGuanSha && !breakBase
  const withExtrasFormed = extrasGuanSha && !breakWithExtras

  const gwRooted =
    (shishen.tou('正官') && shishen.zang('正官')) ||
    (shishen.tou('七杀') && shishen.zang('七杀'))
  const parts: string[] = [`月令 ${bazi.monthZhi} ${bazi.dayYang ? '阳刃' : '阴刃'}`]
  if (gwRooted) parts.push('官杀透根制之')
  else if (baseGuanSha) parts.push('官杀透而未通根')
  else parts.push('官杀须岁运补')
  if (bazi.monthZhiBeingChong) parts.push('月令被冲')

  return emitGeju(
    { name: '阳刃格', note: parts.join('，') },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
