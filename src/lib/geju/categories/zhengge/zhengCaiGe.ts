import { readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { monthGeFormed } from './_util'

/**
 * 正财格 — 月令正财，身可任，无比劫夺财。
 *
 * bazi-skills 5+1 条:
 *  1. 月令本气正财 OR 月令藏 + 透干              [静态]
 *  2. 财喜藏 / 透财须有官杀护卫
 *  3. 日主身强能任财                              [静态]
 *  4. 无比劫紧贴夺财 (除非官杀制)                [岁运透比劫无官杀救 → Break]
 *  5. 身弱通关 (本 detector 不处理)
 *  6. (升格) 财生官 / 食伤生财
 */
export function isZhengCaiGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('正财')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const bijieAdjCai =
    shishen.adjacentTou('劫财', '正财') || shishen.adjacentTou('比肩', '正财')
  const baseClean = !(bijieAdjCai && !shishen.touCat('官杀'))
  const baseFormed = baseClean

  const extClean = baseClean && !(
    extras.touCat('比劫') && !shishen.touCat('官杀') && !extras.touCat('官杀')
  )
  const withExtrasFormed = extClean

  return emitGeju(
    { name: '正财格', note: '月令正财 (本气或透根)，身可任，比劫紧贴有官杀制' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
