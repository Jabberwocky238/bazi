import { readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { monthGeFormed } from './_util'

/**
 * 正印格 — 月令正印，无财破印，身印平衡。
 *
 * bazi-skills 4+1 条:
 *  1. 月令本气正印 OR 月令藏 + 透干              [静态]
 *  2. 正印透干通根                                [由 monthGeFormed 近似]
 *  3. 无财紧贴破印 (除非比劫救)                  [岁运透财无比劫救 → Break]
 *  4. 身印平衡 (身极旺无财食伤泄 → 闷气机)       [静态]
 *  5. (升格) 官印相生 → 转 官印相生
 */
export function isZhengYinGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('正印')) return null
  if (strength.level === '身极旺' && !shishen.touCat('财') && !shishen.touCat('食伤')) return null

  const caiAdjYin =
    shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('偏财', '正印')
  const baseClean = !(caiAdjYin && !shishen.touCat('比劫'))
  const baseFormed = baseClean

  const extClean = baseClean && !(
    extras.touCat('财') && !shishen.touCat('比劫') && !extras.touCat('比劫')
  )
  const withExtrasFormed = extClean

  return emitGeju(
    { name: '正印格', note: '月令正印 (本气或透根)，无紧贴财破印' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
