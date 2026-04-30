import { readBazi, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 偏印格 — 实际判据 (与 md 5 条对照)：
 *  ① 月令本气偏印 (md 条件 1; 偏印透 + 月令藏 路径未实现)。
 *  ② 偏印紧贴食神且无财 (枭神夺食) → 拦截 (md 条件 3)。
 *  ③ 偏印 (透干 + 主气) 总数 ≤ 2 (md 条件 5 "宜少不宜多")。
 *  ④ 身非极旺 (md 条件 4 "身强印重需另取用")。
 *  偏印透干通根 (md 条件 2): 月支本气覆盖透干, 中气/余气根未单独 check。
 *  与日主/财/食伤的取用搭配 (md 条件 4 详分): 不处理。
 */
export function isPianYinGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  if (!monthGeFormed('偏印')) return null
  const xiao = shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')
  if (xiao) return null
  const ganCount = bazi.mainArr.filter((p) => p.shishen === '偏印').length
  const mainCount = shishen.mainAt('偏印').length
  if (ganCount + mainCount > 2) return null
  if (strength.level === '身极旺') return null
  return { name: '偏印格', note: '月令偏印 (本气或透根)，量不过重，食神有护' }
}
