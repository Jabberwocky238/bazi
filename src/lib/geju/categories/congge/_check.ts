import type { Ctx } from '../../ctx'
import type { ShishenCat } from '../../ctx'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从X 共用判据（依《滴天髓》"若有一毫印绶，即不为从"）：
 * - 日主**无任何比劫 / 印根**（天干无比印透，四柱藏干无比印）
 * - 目标类别透干
 * - 地支本气同 target 五行 ≥ 3 位（无论月令是否 target）
 * - 月令必须是 target 或 target 党 (财/官杀/食伤 之一)
 */
export function checkCong(ctx: Ctx, target: ShishenCat, targetWx: string): { note: string } | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (!ctx.touCat(target)) return null
  // 月令必须非印比 (否则不从)
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  const zhiSupport = ctx.zhiMainWxCount(targetWx as WuXing)
  // 无论月令是否 target，地支都需至少 3 位 target 五行本气
  if (zhiSupport < 3) return null
  const monthIs = ctx.monthCat === target
  return {
    note: `日主无根 (0 比劫印)${monthIs ? `，月令${target}` : ''}，地支 ${targetWx} ${zhiSupport} 位`,
  }
}
