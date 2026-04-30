import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 壬骑龙背 — 实际判据 (与 md `两气成象/水土对/壬骑龙背/成立条件.md` 4 条对照)：
 *  ① 日柱 === 壬辰 (md 条件 1, 必要)。
 *  ② 命局无 戌 → 辰戌冲水库则破 (md 条件 2)。
 *  ③ 至少满足一项 (md 条件 3 "命局配合得当"): 另一柱透壬 / 另一柱见辰 / 金生水 / 木泄秀。
 *  ④ 火 / 土 透干各 < 2 (md 条件 4 "不宜过度火土", 蒸干 / 埋水)。
 */
export function isRenQiLongBei(): GejuHit | null {
  const bazi = readBazi()
  if (bazi.dayGz !== '壬辰') return null
  const hasXu = bazi.mainArr.some((p) => p.zhi === '戌')
  if (hasXu) return null
  const { year, month, hour } = bazi.pillars
  const otherRen = [year, month, hour].some((p) => p.gan === '壬')
  const otherChen = ([year.zhi, month.zhi, hour.zhi] as string[]).includes('辰')
  const hasJin = bazi.touWx('金') || bazi.rootWx('金')
  const hasMu = bazi.touWx('木')
  if (!otherRen && !otherChen && !hasJin && !hasMu) return null
  if (bazi.ganWxCount('火') >= 2) return null
  if (bazi.ganWxCount('土') >= 2) return null
  return {
    name: '壬骑龙背',
    note: `日柱壬辰${otherRen ? '+壬' : ''}${otherChen ? '+辰' : ''}${hasJin ? '+金生' : ''}${hasMu ? '+木泄' : ''}`,
  }
}
