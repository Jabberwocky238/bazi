import { readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 正财格 — 实际判据 (与 md 5+1 条对照)：
 *  ① 月令本气正财 (md 条件 1; 财透 + 月令藏 路径未实现)。
 *  ② 身非极弱 / 近从弱 (md 条件 3 "身强能任财")。
 *  ③ 比劫 (比肩/劫财) 紧贴正财 且 无官杀透 → 拦截 (md 条件 4 "比劫夺财需官杀制")。
 *  财藏透有讲究 (md 条件 2): 不处理。
 *  身弱通关取用 (md 条件 5): 不处理 (本格已经在 ② 拦截极弱)。
 *  财生官 / 食伤生财 (md 条件 6 升格): 不处理。
 */
export function isZhengCaiGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  if (!monthGeFormed('正财')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null
  const bijieAdjCai =
    shishen.adjacentTou('劫财', '正财') || shishen.adjacentTou('比肩', '正财')
  if (bijieAdjCai && !shishen.touCat('官杀')) return null
  return { name: '正财格', note: '月令正财 (本气或透根)，身可任，比劫紧贴有官杀制' }
}
