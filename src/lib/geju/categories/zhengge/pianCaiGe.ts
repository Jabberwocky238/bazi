import { readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { monthGeFormed } from './_util'

/**
 * 偏财格 — 月令偏财，身能担，无比劫夺财。
 *
 * bazi-skills 4+2 条:
 *  1. 月令本气偏财 OR 月令藏 + 透干              [静态]
 *  2. 偏财藏透无严苛禁忌
 *  3. 日主身强要求宽松 (不极弱无根即可)          [静态]
 *  4. 无比劫紧贴夺财 (除非食伤化或官杀制)        [岁运透比劫无救 → Break]
 *  5. 时上偏财格 (升格)
 *  6. (升格) 食伤生财 / 财生官杀
 */
export function isPianCaiGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('偏财')) return null
  const isExtremelyWeak = strength.level === '身极弱' || strength.level === '近从弱'
  if (isExtremelyWeak && shishen.countCat('比劫') + shishen.countCat('印') === 0) return null

  const bijieAdjCai =
    shishen.adjacentTou('劫财', '偏财') || shishen.adjacentTou('比肩', '偏财')
  const baseClean = !(bijieAdjCai && !shishen.touCat('食伤') && !shishen.touCat('官杀'))
  const baseFormed = baseClean

  const extClean = baseClean && !(
    extras.touCat('比劫')
    && !shishen.touCat('食伤') && !shishen.touCat('官杀')
    && !extras.touCat('食伤') && !extras.touCat('官杀')
  )
  const withExtrasFormed = extClean

  return emitGeju(
    { name: '偏财格', note: '月令偏财 (本气或透根)，身可担，比劫紧贴有食伤/官杀化' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
