import { readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 正官格 — 实际判据 (与 md 5+1 条对照)：
 *  ① 月令本气正官 (md 条件 1; "官透 + 月令藏" 路径未实现)。
 *  ② 无七杀透 (md 条件 2)。
 *  ③ 伤官紧贴正官且无印 → 拦截 (md 条件 3; 不区分金水伤官喜见官等例外)。
 *  ④ 身非极弱 / 近从弱 (md 条件 4)。
 *  官星通根 (md 条件 5): 由月支本气近似, 未单独 check。
 *  财生官 / 印护官 (md 条件 6 升格): 不处理, 升格转 财官印全 等独立 detector。
 */
export function isZhengGuanGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  if (!monthGeFormed('正官')) return null
  if (shishen.tou('七杀')) return null
  if (shishen.tou('伤官') && shishen.adjacentTou('伤官', '正官') && !shishen.touCat('印')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null
  return { name: '正官格', note: '月令正官 (本气或透根)，不混杀无伤紧贴，身可任' }
}
