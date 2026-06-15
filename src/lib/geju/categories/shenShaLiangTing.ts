import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 身杀两停（收紧版）：
 *  1. 日主身旺 且 本气/中气有根 (有扶)。
 *  2. 七杀天干透 + 地支通根。
 *  3. 七杀数量 ≥ 2 (否则只是"杀微")。
 *  4. 无正官混杂。
 */
export function isShenShaLiangTing(ctx: Ctx): GejuHit | null {
  if (!ctx.shenWang) return null
  if (!ctx.rootExt(ctx.dayWx)) return null
  if (!ctx.tou('七杀')) return null
  if (!ctx.zang('七杀')) return null
  if (ctx.countCat('官杀') < 3) return null
  if (ctx.tou('正官')) return null
  return { name: '身杀两停', note: '身旺有根 · 七杀透根数≥2 · 官杀不混' }
}
