import { readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 偏财格 — 实际判据 (与 md 4+2 条对照)：
 *  ① 月令本气偏财 (md 条件 1; 财透 + 月令藏 路径未实现)。
 *  ② 身极弱 / 近从弱 且 比劫+印 总数 = 0 → 拦截 (md 条件 3 "宽松版身强要求, 极弱无印比难担财")。
 *  ③ 比劫 (比肩/劫财) 紧贴偏财 且 无食伤透 / 无官杀透 → 拦截 (md 条件 4)。
 *  偏财藏透 (md 条件 2): 不处理 (md 本身无禁忌)。
 *  时上偏财格 (md 条件 5 升格): 不处理。
 *  食伤生财 / 财生官杀 (md 条件 6 升格): 不处理。
 */
export function isPianCaiGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  if (!monthGeFormed('偏财')) return null
  const isExtremelyWeak = strength.level === '身极弱' || strength.level === '近从弱'
  if (isExtremelyWeak && shishen.countCat('比劫') + shishen.countCat('印') === 0) return null
  const bijieAdjCai =
    shishen.adjacentTou('劫财', '偏财') || shishen.adjacentTou('比肩', '偏财')
  if (bijieAdjCai && !shishen.touCat('食伤') && !shishen.touCat('官杀')) return null
  return { name: '偏财格', note: '月令偏财 (本气或透根)，身可担，比劫紧贴有食伤/官杀化' }
}
