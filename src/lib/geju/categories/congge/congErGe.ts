import { WX_GENERATED_BY, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从儿格：日主无根 + 食伤成势 + 无印 + 无官杀 + 无比劫帮身。
 * 《滴天髓·从儿》"从儿不管身强弱，只要吾儿又遇儿"；"从儿最忌官杀，次忌印绶"。
 */
export function isCongErGe(ctx: Ctx): GejuHit | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (ctx.countCat('官杀') > 0) return null
  if (!ctx.touCat('食伤')) return null
  const ssWx = WX_GENERATED_BY[ctx.dayWx] as WuXing
  const monthIs = ctx.monthCat === '食伤'
  const zhiN = ctx.zhiMainWxCount(ssWx)
  if (!monthIs && zhiN < 3) return null
  // md 条件 4: 食伤 > 财 (财多则变从势)
  if (ctx.countCat('食伤') <= ctx.countCat('财')) return null
  return {
    name: '从儿格',
    note: `无比劫印官，食伤成势 (${monthIs ? '月令食伤' : `地支 ${ssWx} ${zhiN} 位`}) · 食伤 > 财`,
  }
}
