import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 食神格（依《子平真诠·论食神》5 条必要）：
 */
export function isShiShenGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '食神')) return null
  if (!ctx.tou('食神')) return null
  if (!ctx.zang('食神')) return null
  if (ctx.tou('伤官')) return null
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  const xiaoDuoShi =
    ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')
  if (xiaoDuoShi) return null
  return { name: '食神格', note: '月令食神透根，不混伤，无枭夺食' }
}
