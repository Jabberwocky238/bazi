import { GejuContext, KUIGANG_DAY, type GejuHit } from '../types'
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

export function isKuiGangGe(ctx: GejuContext): GejuHit | null {
  if (!KUIGANG_DAY.has(ctx.dayGz)) return null
  if (!ctx.strength.shenWang) return null
  const forbidden = KUIGANG_FORBIDDEN_WX[ctx.dayGz]
  if (forbidden && ctx.touWx(forbidden as WuXing)[0]) return null
  if (ctx.dayZhi === '辰' && ctx.mainArr.some((p, i) => i !== 2 && p.pillar.zhi.str === '戌')) return null
  if (ctx.dayZhi === '戌' && ctx.mainArr.some((p, i) => i !== 2 && p.pillar.zhi.str === '辰')) return null
  return { name: '魁罡格', note: `日柱 ${ctx.dayGz} 魁罡 · 身旺 · 无忌透无冲` }
}
