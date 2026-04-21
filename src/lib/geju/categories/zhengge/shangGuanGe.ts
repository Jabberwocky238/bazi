import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/** 伤官格：月令伤官 + 伤官透根 + 无正官 + 不混食神 + 身非极弱。 */
export function isShangGuanGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '伤官')) return null
  if (ctx.tou('正官')) return null
  if (ctx.tou('食神')) return null
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  return { name: '伤官格', note: '月令伤官 (本气或透根)，无官可见，不混食' }
}
