import { YANG_REN, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 阳刃格（依《子平真诠·论阳刃》5 条；按扩展定义兼含阴干刃位，以 `ctx.dayYang` 标注）。
 */
export function isYangRenGe(ctx: Ctx): GejuHit | null {
  if (ctx.monthZhi !== YANG_REN[ctx.dayGan]) return null
  // 伤官紧贴正官无印救 → 破格；其余结构完备度写在 note。
  if (ctx.tou('正官') && !ctx.tou('七杀') && ctx.tou('伤官') && !ctx.touCat('印')) return null
  const gwRooted =
    (ctx.tou('正官') && ctx.zang('正官')) ||
    (ctx.tou('七杀') && ctx.zang('七杀'))
  const parts: string[] = [`月令 ${ctx.monthZhi} ${ctx.dayYang ? '阳刃' : '阴刃'}`]
  if (gwRooted) parts.push('官杀透根制之')
  else if (ctx.touCat('官杀')) parts.push('官杀透而未通根')
  else parts.push('官杀未透 (结构未臻完备)')
  if (ctx.monthZhiBeingChong) parts.push('月令被冲')
  return { name: '阳刃格', note: parts.join('，') }
}
