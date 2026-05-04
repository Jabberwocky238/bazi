import { readBazi, readExtras, readShishen } from '../../hooks'
import { YANG_REN } from '../../types'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 羊刃劫财 — 阳干日主月刃 + 劫财透干 + 无官杀制 (病象).
 *
 * bazi-skills 4 维度 (本格本质是"身旺过头无出口"):
 *  1. 羊刃与劫财位置 (月日支贴身最强)            [静态]
 *  2. 化泄之物 (食伤 / 官杀)                      [岁运透官杀 → 出口 Break]
 *  3. 身旺程度
 *  4. 财星位置 (近 + 无救 → 群比夺财)
 *
 *  本 detector: 1 静态严判; 2 主局严判 + 岁运透官杀 → 出口已开 (病象消解 Break).
 */
export function isYangRenJieCai(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()

  if (!bazi.dayYang) return null
  const yr = YANG_REN[bazi.dayGan]
  if (!yr) return null
  if (bazi.pillars.month.zhi !== yr) return null
  if (!shishen.tou('劫财')) return null

  const baseClean = !shishen.touCat('官杀')
  const baseFormed = baseClean

  const extClean = baseClean && !extras.touCat('官杀')
  const withExtrasFormed = extClean

  return emitGeju(
    { name: '羊刃劫财', note: `月刃 ${yr} + 劫财透干 · 无官杀制` },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
