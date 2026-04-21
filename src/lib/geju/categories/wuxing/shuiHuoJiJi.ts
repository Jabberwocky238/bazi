import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { shuiHuoBase } from './_shuiHuoBase'

/** 水火既济：水火有根势均 + 木通关 + 无重金破木。 */
export function isShuiHuoJiJi(ctx: Ctx): GejuHit | null {
  if (!shuiHuoBase(ctx)) return null
  if (!ctx.touWx('木')) return null
  if (ctx.ganWxCount('金') >= 2) return null
  return { name: '水火既济', note: '水火有根势均 · 木通关 · 无重金破木' }
}
