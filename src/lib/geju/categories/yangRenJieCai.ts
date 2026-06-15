import { YANG_REN, type Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 羊刃劫财（收紧版）：
 *  1. 阳干日主。
 *  2. 月支 = 日主阳刃位（非"任一支"）。
 *  3. 劫财天干透 (年 / 月 / 时)，非仅藏干。
 *  4. 无官杀透制（若官杀制刃，属于"羊刃驾杀"格）。
 */
export function isYangRenJieCai(ctx: Ctx): GejuHit | null {
  if (!ctx.dayYang) return null
  const yr = YANG_REN[ctx.dayGan]
  if (!yr) return null
  if (ctx.pillars.month.zhi !== yr) return null
  if (!ctx.tou('劫财')) return null
  if (ctx.touCat('官杀')) return null
  return { name: '羊刃劫财', note: `月刃 ${yr} + 劫财透干 · 无官杀制` }
}
