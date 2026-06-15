import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/** 水多木漂：木日主 + 水过旺 + 木无根 + 无土 + 无火。 */
export function isShuiDuoMuPiao(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  const shuiMany = ctx.ganWxCount('水') >= 2 || ctx.zhiMainWxCount('水') >= 3
  if (!shuiMany) return null
  if (ctx.zhiMainWxCount('木') !== 0) return null
  if (ctx.touWx('土')) return null
  if (ctx.touWx('火')) return null
  return { name: '水多木漂', note: '水盛 · 木无根 · 无土制水无火泄木' }
}
