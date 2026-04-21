import { YANG_REN, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 七杀格（依《子平真诠·论七杀》5 条）：
 */
export function isQiShaGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '七杀')) return null
  if (ctx.tou('正官')) return null
  const foodRooted = ctx.tou('食神') && ctx.zang('食神') &&
    ctx.adjacentTou('食神', '七杀')
  const yinRooted = ctx.touCat('印') && (ctx.zang('正印') || ctx.zang('偏印'))
  const renJiaSha = ctx.dayYang && ctx.mainArr.some(
    (p, i) => i !== 2 && p.zhi === (YANG_REN[ctx.dayGan] ?? ''),
  )
  if (!foodRooted && !yinRooted && !renJiaSha) return null
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  return {
    name: '七杀格',
    note: foodRooted ? '月令七杀 + 食神紧贴制 (透根)' :
          yinRooted ? '月令七杀 + 印化 (透根)' : '月令七杀 + 阳刃敌杀',
  }
}
