import type { Ctx } from '../../ctx'
import type { Shishen } from '@jabberwocky238/bazi-engine'

/** 通用"月令X格"工厂：月令主气为 target OR target 透干 + 月令地支藏。 */
export function monthGeFormed(ctx: Ctx, target: string): boolean {
  const monthMain = (ctx.pillars.month.hideShishen[0] ?? '') as string
  if (monthMain === target) return true
  const monthHide = (ctx.pillars.month.hideShishen as readonly string[]).includes(target)
  return ctx.tou(target as Shishen) && monthHide
}
