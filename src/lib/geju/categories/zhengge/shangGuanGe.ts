import { readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { monthGeFormed } from './_util'

/**
 * 伤官格 — 月令伤官，身有根，无官见无食混。
 *
 * bazi-skills 5 条:
 *  1. 月令本气伤官 OR 月令藏 + 透干              [静态]
 *  2. 伤官透干通根                                [由 monthGeFormed 近似]
 *  3. 无正官 (伤官见官为祸)                       [岁运透正官 → Break, 金水伤官喜见官未实现]
 *  4. 身伤配比决定取用                            [静态/由 strength]
 *  5. 伤官清而不杂                                [岁运透食神 → 混杂 Break]
 */
export function isShangGuanGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('伤官')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const baseClean3 = !shishen.tou('正官')
  const baseClean5 = !shishen.tou('食神')
  const baseFormed = baseClean3 && baseClean5

  const extClean3 = baseClean3 && !extras.tou('正官')
  const extClean5 = baseClean5 && !extras.tou('食神')
  const withExtrasFormed = extClean3 && extClean5

  return emitGeju(
    { name: '伤官格', note: '月令伤官 (本气或透根)，无官可见，不混食' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
