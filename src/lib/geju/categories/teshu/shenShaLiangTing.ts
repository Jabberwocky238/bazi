import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 身杀两停 —— md：「日主有根有扶」「七杀透干通根」「身杀旺度相当」「无官杀混杂」。
 * 采用 shenWang + 七杀通根 + 无正官，作为"力量势均"的定性近似。
 */
export function isShenShaLiangTing(ctx: Ctx): GejuHit | null {
  if (!ctx.shenWang) return null
  if (!ctx.tou('七杀')) return null
  if (!ctx.zang('七杀')) return null
  if (ctx.tou('正官')) return null
  return { name: '身杀两停', note: '身旺 · 七杀透根 · 官杀不混' }
}
