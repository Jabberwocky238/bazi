import { KUIGANG_DAY, type Ctx } from '../../types'
import type { GejuHit } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/** 魁罡格（依《三命通会·论魁罡》4 条）。 */
const KUIGANG_FORBIDDEN_WX: Record<string, string> = {
  庚辰: '火', 庚戌: '火', 壬辰: '火', 戊戌: '水',
}

export function isKuiGangGe(ctx: Ctx): GejuHit | null {
  if (!KUIGANG_DAY.has(ctx.dayGz)) return null
  if (!ctx.shenWang) return null
  const forbidden = KUIGANG_FORBIDDEN_WX[ctx.dayGz]
  if (forbidden && ctx.touWx(forbidden as WuXing)) return null
  if (ctx.dayZhi === '辰' && ctx.mainArr.some((p, i) => i !== 2 && p.zhi === '戌')) return null
  if (ctx.dayZhi === '戌' && ctx.mainArr.some((p, i) => i !== 2 && p.zhi === '辰')) return null
  return { name: '魁罡格', note: `日柱 ${ctx.dayGz} 魁罡 · 身旺 · 无忌透无冲` }
}
