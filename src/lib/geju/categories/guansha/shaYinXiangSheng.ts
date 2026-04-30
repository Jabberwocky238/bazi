import { readBazi, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 杀印相生：七杀透干或月令七杀 + 印透干。
 * 允许正官藏支（不透则不算混杂）。
 *
 * 互斥条件：**伤官合杀成立时七杀已被合去，无杀可化**。
 * 依《子平真诠·论七杀》"杀用印则不用食伤，杀用食伤则不用印"——
 * 七杀用神排他；《子平真诠·论伤官》"合杀者，取其合以去杀"——
 * 合后杀已不独立存在，不能再论相生。
 *
 * 【岁运】md 内容.md "大运 / 流年 / 财星是否破印都会影响实际发挥":
 *   - 岁运透财紧贴印 → 破印链断 (suiyunBreak)。
 *   - 主局缺杀 + 岁运补杀 → 激活成格 (suiyunTrigger);
 *     主局缺印 + 岁运补印 → 同上。
 *   当前 detector 仅扫主柱, 未叠加岁运。
 */
export function isShaYinXiangSheng(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  // md 条件 1: 七杀存在于命局 (月令本气 OR 透 OR 任一位藏)
  const monthMainSha = bazi.pillars.month.hideShishen[0] === '七杀'
  const shaPresent = shishen.tou('七杀') || shishen.zang('七杀')
  if (!monthMainSha && !shaPresent) return null
  if (shishen.tou('正官')) return null
  // md 条件 2: 印透通根
  if (!shishen.touCat('印')) return null
  if (!(shishen.zang('正印') || shishen.zang('偏印'))) return null
  // md 条件 3: 七杀→印→日主紧贴。印须在月干或时干 (紧贴日主)
  const yinAdjRi =
    bazi.pillars.month.shishen === '正印' || bazi.pillars.month.shishen === '偏印' ||
    bazi.pillars.hour.shishen === '正印' || bazi.pillars.hour.shishen === '偏印'
  if (!yinAdjRi) return null
  if (shishen.tou('七杀')) {
    const adj = shishen.adjacentTou('七杀', '正印') || shishen.adjacentTou('七杀', '偏印')
    if (!adj) return null
  }
  // md 条件 4: 无财紧贴克印
  if (shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('正财', '偏印') ||
      shishen.adjacentTou('偏财', '正印') || shishen.adjacentTou('偏财', '偏印')) return null
  // md 条件 5: 日主非极弱
  if (strength.level === '身极弱' || strength.level === '近从弱') return null
  // 伤官合杀互斥
  if (!bazi.dayYang && shishen.tou('伤官') && shishen.tou('七杀') &&
      shishen.adjacentTou('伤官', '七杀')) {
    return null
  }
  return { name: '杀印相生', note: '七杀透根 · 印紧贴日主化杀 · 无财破无极弱' }
}
