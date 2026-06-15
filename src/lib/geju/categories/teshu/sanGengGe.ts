import { readBazi, readExtras, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 三庚格 — 天干庚 ≥ 3 位 + 庚金为日主喜用.
 *
 *  bazi-skills 条件:
 *   1. 天干四位中 ≥ 3 位为庚金     [可被岁运补: 主局 2 庚 + 岁运透庚 → Trigger]
 *   2. 庚金为日主喜用              [静态: 日主庚辛(忌)直接破]
 *
 *  【岁运】岁运透庚 → 加量 (已成则维持; 主局 2 庚则 Trigger).
 */
export function isSanGengGe(): GejuHit | null {
  const bazi = readBazi()
  const strength = readStrength()
  const extras = readExtras()

  if (bazi.dayWx === '金') return null
  if (bazi.dayWx === '木' && strength.shenRuo) return null

  const baseGengN = bazi.mainArr.filter((p) => p.gan === '庚').length
  const extraGengN = extras.extraArr.filter((p) => p.gan === '庚').length
  const allGengN = baseGengN + extraGengN

  const baseFormed = baseGengN >= 3
  const withExtrasFormed = allGengN >= 3

  if (!baseFormed && !withExtrasFormed) return null

  return emitGeju(
    {
      name: '三庚格',
      note: baseFormed
        ? `天干庚 ${baseGengN} 位 · 日主${bazi.dayGan}为用`
        : `天干庚 ${baseGengN}+岁运${extraGengN}=${allGengN} 位 · 日主${bazi.dayGan}为用`,
    },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
