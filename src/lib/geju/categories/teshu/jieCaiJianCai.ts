import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 劫财见财 —— md：「劫财透干通根 + 财星透干 + 财弱于比劫 + 无官无食伤救」。
 */
export function isJieCaiJianCai(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('劫财')) return null
  if (!ctx.zang('劫财')) return null
  if (!ctx.touCat('财')) return null
  if (ctx.countCat('比劫') <= ctx.countCat('财')) return null
  if (ctx.touCat('官杀')) return null
  if (ctx.touCat('食伤')) return null
  return { name: '劫财见财', note: '劫财透根 · 财弱无官食救 · 夺财' }
}
