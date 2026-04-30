import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 天元一气 —— md：「年月日时四柱之干同为一字」。
 *
 * 【岁运】md 内容.md 极敏感:
 *   - 大运逆气势 (与本字五行相克) → 阶段性破格。
 *   - 流年五行冲破地支之根 → 流年极凶。
 *   - 大运回顺气势 → 重新激活, 由破转贵。
 *   当前 detector 仅看四干同字, 不计岁运对气势的冲克。
 */
export function isTianYuanYiQi(): GejuHit | null {
  const bazi = readBazi()
  const g = bazi.pillars.year.gan
  if (!g) return null
  if (!bazi.mainArr.every((p) => p.gan === g)) return null
  return { name: '天元一气', note: `四柱天干同为 ${g}` }
}
