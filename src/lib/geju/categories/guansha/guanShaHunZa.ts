import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 官杀混杂：正官与七杀同时存在，**至少一方透干**。
 *   - 显混杂 = 两者俱透干（最典型）
 *   - 隐混杂 = 一透一藏
 *   - 均藏 → md 未列为破格，本 detector 不识别
 */
export function isGuanShaHunZa(ctx: Ctx): GejuHit | null {
  if (!ctx.has('正官') || !ctx.has('七杀')) return null
  const bothTou = ctx.tou('正官') && ctx.tou('七杀')
  const oneTou = ctx.tou('正官') || ctx.tou('七杀')
  if (!oneTou) return null
  return {
    name: '官杀混杂',
    note: bothTou ? '正官 + 七杀 天干双透 (显混杂)' : '正官 / 七杀 一透一藏 (隐混杂)',
  }
}
