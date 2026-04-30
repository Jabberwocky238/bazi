import { readBazi, readStrength } from '../../hooks'
import { LU, CHONG_PAIR, yimaFrom } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 禄马同乡（依 md 5 条）：
 *  1. 日主禄位落于命局地支。
 *  2. 驿马字出现于命局地支。
 *  3. 禄与驿马同一地支。
 *  4. 该地支不被冲。
 *  5. 日主非极弱 ("马忌身衰")。
 */
export function isLuMaTongXiang(): GejuHit | null {
  const bazi = readBazi()
  const strength = readStrength()
  const lu = LU[bazi.dayGan]
  const ymY = yimaFrom(bazi.yearZhi)
  const ymD = yimaFrom(bazi.dayZhi)
  const pillars = bazi.mainArr
  const zhis = pillars.map((p) => p.zhi) as string[]
  for (let i = 0; i < pillars.length; i++) {
    const p = pillars[i]
    if (p.zhi === lu && (p.zhi === ymY || p.zhi === ymD)) {
      // md 条件 4: 同乡地支不被冲
      const chong = CHONG_PAIR[p.zhi]
      if (chong && zhis.includes(chong)) continue
      // md 条件 5: 身非极弱
      if (strength.level === '身极弱' || strength.level === '近从弱') continue
      return { name: '禄马同乡', note: `${['年', '月', '日', '时'][i]}柱 ${p.zhi} 禄马同位，不冲身可任` }
    }
  }
  return null
}
