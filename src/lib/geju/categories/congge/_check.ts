import type { Ctx } from '../../ctx'
import type { ShishenCat } from '../../ctx'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从X 共用判据（依《滴天髓》"若有一毫印绶，即不为从"）：
 * - 日主**无任何比劫 / 印根**（天干无比印透，四柱藏干无比印）
 * - 月令为目标类别 OR 目标在地支主气 ≥ 3
 * - 目标类别透干
 */
export function checkCong(ctx: Ctx, target: ShishenCat, targetWx: string): { note: string } | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (!ctx.touCat(target)) return null
  const monthIs = ctx.monthCat === target
  const zhiSupport = ctx.zhiMainWxCount(targetWx as WuXing)
  if (!monthIs && zhiSupport < 3) return null
  return {
    note: `日主无根 (0 比劫印)，${monthIs ? `月令${target}` : `地支 ${targetWx} ${zhiSupport} 位`}`,
  }
}
