import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { monthGeFormed } from './_util'

/**
 * 偏印格 — 月令偏印，量不过重，无枭夺食。
 *
 * bazi-skills 5 条:
 *  1. 月令本气偏印 OR 月令藏 + 透干              [静态]
 *  2. 偏印透干通根                                [由 monthGeFormed 近似]
 *  3. 无偏印紧贴食神 (除非财救)                  [岁运透偏印 → 加重 Break]
 *  4. 身印关系 (身极旺印重需另取用)              [静态]
 *  5. 偏印不宜过重 (透 + 主气 ≤ 2)               [岁运透偏印 → 超阈 Break]
 */
export function isPianYinGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('偏印')) return null
  if (strength.level === '身极旺') return null

  const ganCount = bazi.mainArr.filter((p) => p.shishen === '偏印').length
  const mainCount = shishen.mainAt('偏印').length
  if (ganCount + mainCount > 2) return null

  const xiao = shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')
  const baseFormed = !xiao

  // 岁运: 偏印加量 → 超阈 Break; 透偏印贴食神且无财救 → Break
  const extraXiaoTou = extras.extraArr.filter((p) => p.shishen === '偏印').length
  const extOverflow = (ganCount + mainCount + extraXiaoTou) > 2
  const extXiao = xiao || (
    extras.tou('偏印') && !shishen.touCat('财') && !extras.touCat('财')
  )
  const withExtrasFormed = !extXiao && !extOverflow

  return emitGeju(
    { name: '偏印格', note: '月令偏印 (本气或透根)，量不过重，食神有护' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
