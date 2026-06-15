import type { Ctx } from '../../types'

/** 水火双透有根 + 势均 — 水火对的共同前置。 */
export function shuiHuoBase(ctx: Ctx): boolean {
  const shuiShow = ctx.touWx('水') && ctx.rootWx('水')
  const huoShow = ctx.touWx('火') && ctx.rootWx('火')
  if (!shuiShow || !huoShow) return false
  const shuiN = ctx.ganWxCount('水') + ctx.zhiMainWxCount('水')
  const huoN = ctx.ganWxCount('火') + ctx.zhiMainWxCount('火')
  return Math.abs(shuiN - huoN) <= 2
}
