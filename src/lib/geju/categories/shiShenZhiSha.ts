import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 食神制杀（依《子平真诠》6 条）：
 *  1. 月令本气七杀 OR 七杀透干通根。
 *  2. 食神透干通根。
 *  3. 食杀力量两停（差距不超过 1 倍：食神位数 ≥ 七杀 / 2 且 ≤ 2 倍）。
 *  4. 食神与七杀位置相邻（紧贴）。
 *  5. 无枭印紧贴克食神，除非有财护。
 *  6. 日主不极弱。
 */
export function isShiShenZhiSha(ctx: Ctx): GejuHit | null {
  const monthMainSha = ctx.pillars.month.hideShishen[0] === '七杀'
  const shaTouRoot = ctx.tou('七杀') && ctx.zang('七杀')
  if (!monthMainSha && !shaTouRoot) return null
  if (!ctx.tou('食神')) return null
  if (!ctx.zang('食神')) return null
  // md 条件 3: 两停
  const shiN = ctx.countOf('食神')
  const shaN = ctx.countOf('七杀')
  if (shaN === 0) return null
  if (shiN * 2 < shaN || shaN * 2 < shiN) return null
  // md 条件 4: 紧贴
  if (!ctx.adjacentTou('食神', '七杀')) return null
  // md 条件 5: 枭夺食
  if (ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')) return null
  // md 条件 6: 非极弱
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  return { name: '食神制杀', note: '食杀两停透根紧贴 · 无枭夺食 · 身可任' }
}
