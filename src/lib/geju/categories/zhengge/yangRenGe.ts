import { YANG_REN, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 阳刃格（依《子平真诠·论阳刃》5 条）。 */
export function isYangRenGe(ctx: Ctx): GejuHit | null {
  if (!ctx.dayYang) return null
  if (ctx.monthZhi !== YANG_REN[ctx.dayGan]) return null
  if (ctx.monthZhiBeingChong) return null
  if (!ctx.touCat('官杀')) return null
  const gwRooted =
    (ctx.tou('正官') && ctx.zang('正官')) ||
    (ctx.tou('七杀') && ctx.zang('七杀'))
  if (!gwRooted) return null
  if (ctx.tou('正官') && !ctx.tou('七杀') && ctx.tou('伤官') && !ctx.touCat('印')) return null
  return { name: '阳刃格', note: `月令 ${ctx.monthZhi} 阳刃，官杀透根制之` }
}
