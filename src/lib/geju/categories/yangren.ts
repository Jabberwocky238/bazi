import { YANG_REN, type Ctx } from '../ctx'
import type { GejuHit } from '../types'

/**
 * 羊刃驾杀（依《子平真诠·论阳刃》5 条）：
 *  1. 日主阳干。
 *  2. 刃位见于月/日/时支。
 *  3. 七杀透干通根，与羊刃势均。
 *  4. 无重印化杀（天干印 < 2 且 地支主气印 < 2）。
 *  5. 无重食伤制杀（同上）。
 */
export function isYangRenJiaSha(ctx: Ctx): GejuHit | null {
  if (!ctx.dayYang) return null
  const yr = YANG_REN[ctx.dayGan]
  if (!yr) return null
  const yrPos = [ctx.pillars[1].zhi, ctx.pillars[2].zhi, ctx.pillars[3].zhi].includes(yr)
  if (!yrPos) return null
  if (!ctx.tou('七杀')) return null
  if (!ctx.zang('七杀')) return null
  if (!ctx.shenWang) return null
  // md 条件 4: 无重印
  const yinGanCount = ctx.pillars.filter(
    (p, i) => i !== 2 && (p.shishen === '正印' || p.shishen === '偏印'),
  ).length
  const yinMainCount = ctx.mainAt('正印').length + ctx.mainAt('偏印').length
  if (yinGanCount >= 2 || yinMainCount >= 2) return null
  // md 条件 5: 无重食伤
  const ssGanCount = ctx.pillars.filter(
    (p, i) => i !== 2 && (p.shishen === '食神' || p.shishen === '伤官'),
  ).length
  const ssMainCount = ctx.mainAt('食神').length + ctx.mainAt('伤官').length
  if (ssGanCount >= 2 || ssMainCount >= 2) return null
  // md 总结: "极依赖大运流年维持两停" → 岁运敏感
  return {
    name: '羊刃驾杀',
    note: `身强 · 阳刃 ${yr} 见于支 · 七杀透根 · 无重印/食伤`,
    suiyunSpecific: true,
  }
}

/**
 * 羊刃劫财：阳干 + 刃位见于月/日/时支 + 劫财透或通根多位。
 */
export function isYangRenJieCai(ctx: Ctx): GejuHit | null {
  if (!ctx.dayYang) return null
  const yr = YANG_REN[ctx.dayGan]
  if (!yr) return null
  const yrPos = [ctx.pillars[1].zhi, ctx.pillars[2].zhi, ctx.pillars[3].zhi].includes(yr)
  if (!yrPos) return null
  if (!ctx.has('劫财')) return null
  return { name: '羊刃劫财', note: `阳刃 ${yr} 见于支 + 劫财并显` }
}
