import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { shuiHuoBase } from './_shuiHuoBase'

/** 水火相战：水火有根势均 + 无木通关 + 无土调和。 */
export function isShuiHuoXiangZhan(ctx: Ctx): GejuHit | null {
  if (!shuiHuoBase(ctx)) return null
  if (ctx.touWx('木')) return null
  if (ctx.touWx('土')) return null
  return { name: '水火相战', note: '水火有根势均 · 无木通关无土调和' }
}
