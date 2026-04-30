import { readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 以财破印 (病转用): 印过旺成病 + 财透通根紧贴印 + 身可任 + 出口 (食伤/官杀)。
 *
 * 【岁运】md 条件 4: 出口可由 主局 OR 大运/流年 补足。
 *   主局缺出口 + 岁运透 食伤/官杀 → suiyunTrigger。
 */
export function isYiCaiPoYin(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()
  // md 条件 1: 印过旺成病
  if (shishen.countCat('印') < 3) return null
  // md 条件 2: 财透通根 + 紧贴印
  const caiTouRoot =
    (shishen.tou('正财') && shishen.zang('正财')) ||
    (shishen.tou('偏财') && shishen.zang('偏财'))
  if (!caiTouRoot) return null
  const caiAdjYin =
    shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('正财', '偏印') ||
    shishen.adjacentTou('偏财', '正印') || shishen.adjacentTou('偏财', '偏印')
  if (!caiAdjYin) return null
  // md 条件 3: 身弱无比劫 → 破印反损身
  if (strength.shenRuo && shishen.countCat('比劫') === 0) return null

  // md 条件 4: 出口 (食伤 OR 官杀) 主局 OR 岁运
  const baseOut = shishen.touCat('食伤') || shishen.touCat('官杀')
  const withOut = baseOut || extras.touCat('食伤') || extras.touCat('官杀')

  return emitGeju(
    { name: '以财破印', note: `印 ${shishen.countCat('印')} 位成病，财紧贴破印有出口` },
    { baseFormed: baseOut, withExtrasFormed: withOut, hasExtras: extras.active },
  )
}
