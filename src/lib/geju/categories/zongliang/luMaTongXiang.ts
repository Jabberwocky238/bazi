import { LU, CHONG_PAIR, yimaFrom, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 禄马同乡（依 md 5 条）：
 *  1. 日主禄位落于命局地支。
 *  2. 驿马字出现于命局地支。
 *  3. 禄与驿马同一地支。
 *  4. 该地支不被冲。
 *  5. 日主非极弱 ("马忌身衰")。
 */
export function isLuMaTongXiang(ctx: Ctx): GejuHit | null {
  const lu = LU[ctx.dayGan]
  const ymY = yimaFrom(ctx.yearZhi)
  const ymD = yimaFrom(ctx.dayZhi)
  const pillars = ctx.mainArr
  const zhis = pillars.map((p) => p.zhi) as string[]
  for (let i = 0; i < pillars.length; i++) {
    const p = pillars[i]
    if (p.zhi === lu && (p.zhi === ymY || p.zhi === ymD)) {
      // md 条件 4: 同乡地支不被冲
      const chong = CHONG_PAIR[p.zhi]
      if (chong && zhis.includes(chong)) continue
      // md 条件 5: 身非极弱
      if (ctx.level === '身极弱' || ctx.level === '近从弱') continue
      return { name: '禄马同乡', note: `${['年', '月', '日', '时'][i]}柱 ${p.zhi} 禄马同位，不冲身可任` }
    }
  }
  return null
}
