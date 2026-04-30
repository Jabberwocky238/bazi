import { readBazi, readShishen } from '../../hooks'
import { YANG_REN } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 羊刃劫财（收紧版）：
 *  1. 阳干日主。
 *  2. 月支 = 日主阳刃位（非"任一支"）。
 *  3. 劫财天干透 (年 / 月 / 时)，非仅藏干。
 *  4. 无官杀透制（若官杀制刃，属于"羊刃驾杀"格）。
 */
export function isYangRenJieCai(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  if (!bazi.dayYang) return null
  const yr = YANG_REN[bazi.dayGan]
  if (!yr) return null
  if (bazi.pillars.month.zhi !== yr) return null
  if (!shishen.tou('劫财')) return null
  if (shishen.touCat('官杀')) return null
  return { name: '羊刃劫财', note: `月刃 ${yr} + 劫财透干 · 无官杀制` }
}
