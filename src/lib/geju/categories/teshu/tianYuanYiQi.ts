import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { ganWuxing, type WuXing } from '@jabberwocky238/bazi-engine'
import { emitGeju } from '../../_emit'

/**
 * 天元一气 — 年月日时四干同为一字.
 *
 *  bazi-skills 条件: 四干同字 (静态).
 *
 *  【岁运】md 内容.md 极敏感:
 *   - 大运逆气势 (与本字五行相克) → Break (阶段性破格)
 *   - 流年五行冲破地支之根 → 流年极凶
 *   - 大运回顺气势 → 重新激活
 *
 *  本 detector: 主局严判 + 岁运透克本字之五行 → Break.
 */
export function isTianYuanYiQi(): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()
  const g = bazi.pillars.year.gan
  if (!g) return null
  if (!bazi.mainArr.every((p) => p.gan === g)) return null

  // 岁运透克"我"之五行 → Break (天元一气最忌克气)
  const selfWx = ganWuxing(g) as WuXing
  const KE: Record<WuXing, WuXing> = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' }
  const keWx = KE[selfWx]
  const breakBy = keWx ? extras.extraGanWxCount(keWx) > 0 : false

  return emitGeju(
    { name: '天元一气', note: `四柱天干同为 ${g}` },
    { baseFormed: true, withExtrasFormed: !breakBy, hasExtras: extras.active },
  )
}
