import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 食神格（依《子平真诠·论食神》5 条必要）：
 */
export function isShiShenGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '食神')) return null
  // 严格"食伤不混"由独立 detector isShiShangHunZa 给出警示；此处不再阻塞成格。
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  const xiaoDuoShi =
    ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')
  if (xiaoDuoShi) return null
  return { name: '食神格', note: '月令食神 (本气或透根)，无枭夺食' }
}
