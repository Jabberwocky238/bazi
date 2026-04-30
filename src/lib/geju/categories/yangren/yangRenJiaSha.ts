import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import { YANG_REN } from '../../types'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 羊刃驾杀 (《子平真诠·论阳刃》5 条):
 *  ① 日主阳干。
 *  ② 阳刃位见于月/日/时支。
 *  ③ 七杀透干通根 (与羊刃势均)。
 *  ④ 无重印化杀 (天干印 < 2 且 主气印 < 2)。
 *  ⑤ 无重食伤制杀 (同上)。
 *
 * 【岁运】md 总结 "极依赖大运流年维持两停":
 *   - 主局成格 + 岁运透 印 / 食伤 任一类 → 两停被打破 (suiyunBreak)。
 *   - 主局成格 + 岁运透 比劫 / 七杀 → 维持两停 (默认 suiyunDefaultTrigger)。
 */
export function isYangRenJiaSha(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()
  if (!bazi.dayYang) return null
  const yr = YANG_REN[bazi.dayGan]
  if (!yr) return null
  const yrPos = [bazi.pillars.month.zhi, bazi.pillars.day.zhi, bazi.pillars.hour.zhi].includes(yr)
  if (!yrPos) return null
  if (!shishen.tou('七杀')) return null
  if (!shishen.zang('七杀')) return null
  if (!strength.shenWang) return null
  // md 条件 4: 无重印
  const yinGanCount = bazi.mainArr.filter(
    (p, i) => i !== 2 && (p.shishen === '正印' || p.shishen === '偏印'),
  ).length
  const yinMainCount = shishen.mainAt('正印').length + shishen.mainAt('偏印').length
  if (yinGanCount >= 2 || yinMainCount >= 2) return null
  // md 条件 5: 无重食伤
  const ssGanCount = bazi.mainArr.filter(
    (p, i) => i !== 2 && (p.shishen === '食神' || p.shishen === '伤官'),
  ).length
  const ssMainCount = shishen.mainAt('食神').length + shishen.mainAt('伤官').length
  if (ssGanCount >= 2 || ssMainCount >= 2) return null

  // 岁运打破两停: 透 印 / 食伤 任一类
  const extrasBreak = extras.touCat('印') || extras.touCat('食伤')

  return emitGeju(
    {
      name: '羊刃驾杀',
      note: `身强 · 阳刃 ${yr} 见于支 · 七杀透根 · 无重印/食伤`,
      suiyunSpecific: true,
    },
    { baseFormed: true, withExtrasFormed: !extrasBreak, hasExtras: extras.active },
  )
}
