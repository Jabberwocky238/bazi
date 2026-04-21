import { YANG_REN, type Ctx } from '../../ctx'
import type { Shishen } from '@jabberwocky238/bazi-engine'

/** 正格通用钩子：月支若是日主的阳刃/阴刃位 → 所有正格让位给阳刃格。 */
export function deferToYangRen(ctx: Ctx): boolean {
  return ctx.monthZhi === YANG_REN[ctx.dayGan]
}

/** 通用"月令X格"工厂：
 *  - 月支若同时是阳刃位 → 归阳刃格独占，所有正格不成立。
 *  - 否则：月令主气为 target OR target 透干 + 月令地支藏。 */
export function monthGeFormed(ctx: Ctx, target: string): boolean {
  if (deferToYangRen(ctx)) return false
  const monthMain = (ctx.pillars.month.hideShishen[0] ?? '') as string
  if (monthMain === target) return true
  const monthHide = (ctx.pillars.month.hideShishen as readonly string[]).includes(target)
  return ctx.tou(target as Shishen) && monthHide
}
