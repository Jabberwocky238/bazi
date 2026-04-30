import { readBazi, readShishen } from '../../hooks'
import { WX_GENERATED_BY } from '../../types'
import type { GejuHit } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从儿格：日主无根 + 食伤成势 + 无印 + 无官杀 + 无比劫帮身。
 * 《滴天髓·从儿》"从儿不管身强弱，只要吾儿又遇儿"；"从儿最忌官杀，次忌印绶"。
 */
export function isCongErGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  // 比劫/印/官杀 天干透 reject (藏干不再拦，与 checkCong 同口径)
  if (shishen.touCat('比劫')) return null
  if (shishen.touCat('印')) return null
  if (shishen.touCat('官杀')) return null
  if (!shishen.touCat('食伤')) return null
  if (bazi.monthCat === '比劫' || bazi.monthCat === '印') return null
  const ssWx = WX_GENERATED_BY[bazi.dayWx] as WuXing
  const zhiN = bazi.zhiMainWxCount(ssWx)
  if (zhiN < 2) return null
  const ssN = shishen.countCat('食伤')
  if (ssN < 4) return null
  if (ssN <= shishen.countCat('财')) return null
  return {
    name: '从儿格',
    note: `天干无印比官，食伤 ${ssN} 位 (地支 ${ssWx} ${zhiN} 位) · 食伤 > 财`,
  }
}
