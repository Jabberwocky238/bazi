import { readBazi, readExtras, readShishen } from '../../hooks'
import { WX_GENERATED_BY } from '../../types'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从儿格 — 日主无根 + 食伤成势 + 无印 + 无官杀 + 无比劫帮身.
 *
 * 《滴天髓·从儿》"从儿不管身强弱，只要吾儿又遇儿"；"从儿最忌官杀，次忌印绶".
 *
 *  - 主局严判量化 + 清纯 (静态)
 *  - 岁运透官杀 / 印 / 比劫 → Break (复根 / 克儿)
 *  - 主局缺食伤透 + 岁运透食伤 → Trigger
 */
export function isCongErGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()

  if (shishen.touCat('比劫')) return null
  if (shishen.touCat('印')) return null
  if (shishen.touCat('官杀')) return null
  if (bazi.monthCat === '比劫' || bazi.monthCat === '印') return null
  const ssWx = WX_GENERATED_BY[bazi.dayWx] as WuXing
  const zhiN = bazi.zhiMainWxCount(ssWx)
  if (zhiN < 2) return null
  const ssN = shishen.countCat('食伤')
  if (ssN < 4) return null
  if (ssN <= shishen.countCat('财')) return null

  // 主局缺食伤透 + 岁运补 → Trigger
  const baseStruct = shishen.touCat('食伤')
  const extStruct = baseStruct || extras.touCat('食伤')

  // 岁运透 比劫 / 印 / 官杀 → Break
  const baseClean = true
  const extClean = baseClean && !extras.touCat('比劫') && !extras.touCat('印') && !extras.touCat('官杀')

  const baseFormed = baseStruct && baseClean
  const withExtrasFormed = extStruct && extClean

  return emitGeju(
    {
      name: '从儿格',
      note: `天干无印比官，食伤 ${ssN} 位 (地支 ${ssWx} ${zhiN} 位) · 食伤 > 财`,
    },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
