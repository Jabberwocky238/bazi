import { readBazi, readStrength } from '../../hooks'
import { KUIGANG_DAY } from '../../types'
import type { GejuHit } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 魁罡格（依《三命通会·论魁罡》4 条）。
 *
 * 【岁运】md 内容.md "日支逢大运流年冲破必有大灾 · 辰戌冲日支必破"。
 *   - 大运 / 流年地支与日支六冲 (辰戌 / 子午等) → 破格 (可挂 suiyunBreak)。
 *   - 岁运透忌神五行 (KUIGANG_FORBIDDEN_WX) → 同样破败。
 *   当前 detector 仅扫主柱, 未叠加岁运冲忌判定。
 */
const KUIGANG_FORBIDDEN_WX: Record<string, string> = {
  庚辰: '火', 庚戌: '火', 壬辰: '火', 戊戌: '水',
}

export function isKuiGangGe(): GejuHit | null {
  const bazi = readBazi()
  const strength = readStrength()
  if (!KUIGANG_DAY.has(bazi.dayGz)) return null
  if (!strength.shenWang) return null
  const forbidden = KUIGANG_FORBIDDEN_WX[bazi.dayGz]
  if (forbidden && bazi.touWx(forbidden as WuXing)) return null
  if (bazi.dayZhi === '辰' && bazi.mainArr.some((p, i) => i !== 2 && p.zhi === '戌')) return null
  if (bazi.dayZhi === '戌' && bazi.mainArr.some((p, i) => i !== 2 && p.zhi === '辰')) return null
  return { name: '魁罡格', note: `日柱 ${bazi.dayGz} 魁罡 · 身旺 · 无忌透无冲` }
}
