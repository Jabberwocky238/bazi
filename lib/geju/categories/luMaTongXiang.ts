// @ts-nocheck — 孤立文件: 依赖 commit 8ff72ee 删除的 ../snapshot 全局读取 API,
//   未接入 geju/index.ts 的 DETECTORS 表 (无任何引用)。待改写为 GejuContext 后再启用。
import { readBazi, readExtras, readStrength } from '../snapshot'
import { LU, CHONG_PAIR, yimaFrom } from '../types'
import type { GejuHit } from '../types'
import type { Gan, Zhi } from '@jabberwocky238/bazi-engine'
import { emitGeju } from '../_emit'

/**
 * 禄马同乡 — 日主之禄与驿马落于同一地支。
 *
 * bazi-skills 5 条 (《渊海子平·论禄》《三命通会·论驿马》《渊海子平·禄马赋》):
 *  1. 日主禄位落于命局地支                       [静态]
 *  2. 驿马字出现于命局地支                       [静态]
 *  3. 禄与驿马同一地支 (本格定义)                [静态]
 *  4. 该地支不被冲、不被合化                     [岁运冲该地支 → Break]
 *  5. 日主非极弱 (马忌身衰)                     [静态]
 */
export function isLuMaTongXiang(): GejuHit | null {
  const bazi = readBazi()
  const strength = readStrength()
  const extras = readExtras()
  const lu = LU[bazi.dayGan as Gan]
  const ymY = bazi.yearZhi ? yimaFrom(bazi.yearZhi) : undefined
  const ymD = bazi.dayZhi ? yimaFrom(bazi.dayZhi) : undefined
  const pillars = bazi.mainArr
  const zhis = pillars.map((p) => p.zhi.name)
  for (let i = 0; i < pillars.length; i++) {
    const p = pillars[i]
    if (p.zhi.name === lu && (p.zhi.name === ymY || p.zhi.name === ymD)) {
      const chong = CHONG_PAIR[p.zhi.name] as Zhi
      if (chong && zhis.includes(chong)) continue
      if (strength.level === '身极弱' || strength.level === '近从弱') continue

      const baseFormed = true
      // 岁运地支冲此禄马同乡支 → Break
      const extraZhis = extras.extraArr.map((e) => e.zhi.name)
      const extraChong = !!chong && extraZhis.includes(chong)
      const withExtrasFormed = !extraChong

      return emitGeju(
        {
          name: '禄马同乡',
          note: `${['年', '月', '日', '时'][i]}柱 ${p.zhi.name} 禄马同位，不冲身可任`,
        },
        { baseFormed, withExtrasFormed, hasExtras: extras.active },
      )
    }
  }
  return null
}
