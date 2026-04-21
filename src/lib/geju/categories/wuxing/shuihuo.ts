import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 水火双透有根 + 势均 — 水火对的共同前置。 */
function shuiHuoBase(ctx: Ctx): boolean {
  const shuiShow = ctx.touWx('水') && ctx.rootWx('水')
  const huoShow = ctx.touWx('火') && ctx.rootWx('火')
  if (!shuiShow || !huoShow) return false
  const shuiN = ctx.ganWxCount('水') + ctx.zhiMainWxCount('水')
  const huoN = ctx.ganWxCount('火') + ctx.zhiMainWxCount('火')
  return Math.abs(shuiN - huoN) <= 2
}

/** 水火既济：水火有根势均 + 木通关 + 无重金破木。 */
export function isShuiHuoJiJi(ctx: Ctx): GejuHit | null {
  if (!shuiHuoBase(ctx)) return null
  if (!ctx.touWx('木')) return null
  if (ctx.ganWxCount('金') >= 2) return null
  return { name: '水火既济', note: '水火有根势均 · 木通关 · 无重金破木' }
}

/** 水火相战：水火有根势均 + 无木通关 + 无土调和。 */
export function isShuiHuoXiangZhan(ctx: Ctx): GejuHit | null {
  if (!shuiHuoBase(ctx)) return null
  if (ctx.touWx('木')) return null
  if (ctx.touWx('土')) return null
  return { name: '水火相战', note: '水火有根势均 · 无木通关无土调和' }
}
