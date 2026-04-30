import { readBazi, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 食神生财（放宽版，和伤官生财同口径）：
 *  1. 食神显：透干 或 月令本气。
 *  2. 财类显：透干 或 藏干 (正偏财不分)。
 *  3. 无印紧贴食神/财。
 *  4. 日主非极弱/近从弱。
 *  5. 无枭夺食 (偏印紧贴食神 且 无财护)。
 *  6. 无比劫紧贴夺财 (无官杀制)。
 */
export function isShiShenShengCai(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const monthMainShi = bazi.pillars.month.hideShishen[0] === '食神'
  if (!shishen.tou('食神') && !monthMainShi) return null
  const caiVisible =
    shishen.touCat('财') || shishen.zang('正财') || shishen.zang('偏财')
  if (!caiVisible) return null
  if (shishen.touCat('印')) {
    const yinAdjShi =
      shishen.adjacentTou('正印', '食神') || shishen.adjacentTou('偏印', '食神')
    const yinAdjCai =
      shishen.adjacentTou('正印', '正财') || shishen.adjacentTou('正印', '偏财') ||
      shishen.adjacentTou('偏印', '正财') || shishen.adjacentTou('偏印', '偏财')
    if (yinAdjShi || yinAdjCai) return null
  }
  if (strength.level === '身极弱' || strength.level === '近从弱') return null
  if (shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')) return null
  const bijieAdjCai =
    shishen.adjacentTou('比肩', '正财') || shishen.adjacentTou('比肩', '偏财') ||
    shishen.adjacentTou('劫财', '正财') || shishen.adjacentTou('劫财', '偏财')
  if (bijieAdjCai && !shishen.touCat('官杀')) return null
  return { name: '食神生财', note: '食神显 · 财显 · 无印紧贴阻 · 非极弱 · 无官/劫克' }
}
