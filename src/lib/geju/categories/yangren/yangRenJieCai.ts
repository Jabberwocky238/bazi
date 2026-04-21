import { YANG_REN, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 羊刃劫财：阳干 + 刃位见于月/日/时支 + 劫财透或通根多位。
 */
export function isYangRenJieCai(ctx: Ctx): GejuHit | null {
  if (!ctx.dayYang) return null
  const yr = YANG_REN[ctx.dayGan]
  if (!yr) return null
  const yrPos = [ctx.pillars.month.zhi, ctx.pillars.day.zhi, ctx.pillars.hour.zhi].includes(yr)
  if (!yrPos) return null
  if (!ctx.has('劫财')) return null
  return { name: '羊刃劫财', note: `阳刃 ${yr} 见于支 + 劫财并显` }
}
