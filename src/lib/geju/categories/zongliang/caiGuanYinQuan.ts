import { readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 财官印全（依 md 5 条）：
 *  1. 三者均透干且通根。
 *  2. 依次相生顺流 (略，位置判定复杂)。
 *  3. 官星清纯 (正官/七杀去一留一)。
 *  4. 无伤官紧贴克官、无比劫紧贴夺财。
 *  5. 日主非极弱。
 */
export function isCaiGuanYinQuan(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  // md 条件 1: 三者透且通根
  const caiTouRoot =
    (shishen.tou('正财') && shishen.zang('正财')) ||
    (shishen.tou('偏财') && shishen.zang('偏财'))
  const guanTouRoot =
    (shishen.tou('正官') && shishen.zang('正官')) ||
    (shishen.tou('七杀') && shishen.zang('七杀'))
  const yinTouRoot =
    (shishen.tou('正印') && shishen.zang('正印')) ||
    (shishen.tou('偏印') && shishen.zang('偏印'))
  if (!caiTouRoot || !guanTouRoot || !yinTouRoot) return null
  // md 条件 3: 官杀不混
  if (shishen.tou('正官') && shishen.tou('七杀')) return null
  // md 条件 4: 伤官贴官 或 比劫贴财 则破
  if (shishen.tou('伤官') && shishen.adjacentTou('伤官', '正官')) return null
  const bijieAdjCai =
    shishen.adjacentTou('比肩', '正财') || shishen.adjacentTou('比肩', '偏财') ||
    shishen.adjacentTou('劫财', '正财') || shishen.adjacentTou('劫财', '偏财')
  if (bijieAdjCai) return null
  // md 条件 5: 非极弱
  if (strength.level === '身极弱' || strength.level === '近从弱') return null
  return { name: '财官印全', note: '财官印三者透根、清纯无紧贴破' }
}
