import { readBazi, readShishen } from '../../hooks'
import { SHI_SHEN_CAT } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 比劫重重 — 实际判据 (md 给的是 4 个判断维度)：
 *  比劫透干 ≥ 2 或 地支主气比劫 ≥ 3 → 触发"重量比劫" (md 维度 1)。
 *  食伤泄秀 / 官杀驾制 / 财星暴露 (md 维度 2/3/4 救应判断): 当前不处理,
 *  仅做密度阈值, 救应路径由其他 detector (食伤泄秀 / 劫财见财) 单独判别。
 */
export function isBiJieChongChong(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const touN = [
    shishen.tou('比肩'), shishen.tou('劫财'),
  ].filter(Boolean).length +
    (bazi.mainArr.filter((p, i) => i !== 2 && SHI_SHEN_CAT[p.shishen] === '比劫').length > 1 ? 1 : 0)
  const zhiN = bazi.mainArr.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '比劫').length
  if (touN < 2 && zhiN < 3) return null
  return { name: '比劫重重', note: `比劫透 ${touN} 位，地支主气 ${zhiN} 位` }
}
