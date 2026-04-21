import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { ganWuxing, GENERATES, type WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 两气成象 —— md：「命局中只有两种五行势均力敌且相生有情」。
 * 条件：只有两种五行出现 (天干+地支主气) + 两者为相生关系 (非相克)。
 */
export function isLiangQiChengXiang(ctx: Ctx): GejuHit | null {
  const wxSet = new Set<string>()
  for (const p of ctx.mainArr) {
    const gw = ganWuxing(p.gan)
    if (gw) wxSet.add(gw)
    const zw = ganWuxing((p.hideGans[0] ?? '') as never)
    if (zw) wxSet.add(zw)
  }
  if (wxSet.size !== 2) return null
  const [a, b] = [...wxSet]
  if (GENERATES[a as WuXing] !== b && GENERATES[b as WuXing] !== a) return null
  const aN = ctx.ganWxCount(a as WuXing) + ctx.zhiMainWxCount(a as WuXing)
  const bN = ctx.ganWxCount(b as WuXing) + ctx.zhiMainWxCount(b as WuXing)
  if (Math.abs(aN - bN) > 2) return null
  return { name: '两气成象', note: `只见 ${a}${b} 两五行且势均相生` }
}
