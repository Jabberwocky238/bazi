import { readBazi, readShishen } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 弃命从势（温和收紧）：
 *  1. 日主本气/中气均无日主五行 (rootExt)。
 *  2. 月令非比劫/印。
 *  3. 三党 (食伤/财/官杀) 各 ≥ 2 位。
 *  4. 三党总和 ≥ 8 (原 ≥ 6)，力量差距 ≤ 2。
 *
 * 【岁运】md 内容.md "大运配合时时代英雄, 不配合时大起大落":
 *   - 岁运透比劫 / 印 → 日主复根, 破从 (suiyunBreak)。
 *   - 岁运补三党之一令势均 → 加固从势 (suiyunTrigger)。
 *   当前 detector 仅扫主柱, 未叠加岁运。
 */
export function isCongShiGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  if (bazi.rootExt(bazi.dayWx)) return null
  if (bazi.monthCat === '比劫' || bazi.monthCat === '印') return null
  const categories = ['食伤', '财', '官杀'] as const
  const counts = categories.map((c) => shishen.countCat(c))
  if (counts.some((n) => n < 2)) return null
  const total = counts.reduce((a, b) => a + b, 0)
  if (total < 8) return null
  const diff = Math.max(...counts) - Math.min(...counts)
  if (diff > 2) return null
  return {
    name: '弃命从势',
    note: `日主无根 · 月令非印比 · 食伤/财/官杀 (${counts.join('/')}, 共 ${total} 位) 势均`,
  }
}
