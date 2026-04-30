import { readBazi, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 食伤泄秀（依 md 4 条 + 1 辅）：
 *  1. 身强。
 *  2. 食/伤透干通根 OR 月令本气。
 *  3. 不混杂 (食或伤为主)。
 *  4. 无枭印紧贴克食伤 (或有财护)。
 */
export function isShiShangXieXiu(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  if (!strength.shenWang) return null
  const shiTouRoot = shishen.tou('食神') && shishen.zang('食神')
  const shangTouRoot = shishen.tou('伤官') && shishen.zang('伤官')
  const monthMain = bazi.pillars.month.hideShishen[0]
  const monthIsShiShang = monthMain === '食神' || monthMain === '伤官'
  if (!shiTouRoot && !shangTouRoot && !monthIsShiShang) return null
  // md 条件 3: 不混杂 (至少一方仅藏支或不透)
  if (shishen.tou('食神') && shishen.tou('伤官')) return null
  // md 条件 4: 枭紧贴食伤 且 无财救
  const xiaoAdj =
    shishen.adjacentTou('偏印', '食神') || shishen.adjacentTou('偏印', '伤官')
  if (xiaoAdj && !shishen.touCat('财')) return null
  return { name: '食伤泄秀', note: '身旺 · 食/伤透根泄秀 · 清而不杂' }
}
