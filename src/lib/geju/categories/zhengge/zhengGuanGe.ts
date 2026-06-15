import { readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { monthGeFormed } from './_util'

/**
 * 正官格 — 月令正官，身能任，不混杀无伤克。
 *
 * bazi-skills 5+1 条:
 *  1. 月令本气正官 OR 月令藏正官 + 透干        [静态: 月令固定]
 *  2. 不混七杀                                    [岁运透七杀 → Break]
 *  3. 无伤官紧贴克正官 (除非有印)               [岁运透伤官无印救 → Break]
 *  4. 日主非极弱 (能任官)                       [静态]
 *  5. 官星有根 (月支本气近似覆盖)
 *  6. (升格) 财生官 / 印护官 → 转 财官印全
 */
export function isZhengGuanGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('正官')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const baseClean2 = !shishen.tou('七杀')
  const baseClean3 = !(shishen.tou('伤官') && shishen.adjacentTou('伤官', '正官') && !shishen.touCat('印'))
  const baseFormed = baseClean2 && baseClean3

  const extClean2 = baseClean2 && !extras.tou('七杀')
  const extClean3 = baseClean3 && !(extras.tou('伤官') && !shishen.touCat('印') && !extras.touCat('印'))
  const withExtrasFormed = extClean2 && extClean3

  return emitGeju(
    { name: '正官格', note: '月令正官 (本气或透根)，不混杀无伤紧贴，身可任' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
