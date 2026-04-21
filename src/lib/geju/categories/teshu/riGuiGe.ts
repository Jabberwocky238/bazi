import { CHONG_PAIR, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 日贵格（依《三命通会·论日贵》6 条必要 + 1 条岁运加重）：
 *  1. 日柱为丁亥/丁酉/癸巳/癸卯。
 *  2. 有官星（非必要，加品）。
 *  3. 官星不被冲。
 *  4. 有财生官（非必要，加品）。
 *  5. 日支贵人不被**局内**冲/合去。
 *  6. 贵人/财官不在空亡位 (ctx 无空亡 API，TODO)。
 *  7. **【岁运相关，suiyunBreak】**：大运流年冲/合/害日支贵人 → 破格。
 *     待 ctx 扩展岁运数据后在此标记 suiyunBreak=true。
 */
const RI_GUI = new Set(['丁亥', '丁酉', '癸巳', '癸卯'])
const HE_OF_RIGUI: Record<string, string> = {
  亥: '寅', 酉: '辰', 巳: '申', 卯: '戌',
}

export function isRiGuiGe(ctx: Ctx): GejuHit | null {
  if (!RI_GUI.has(ctx.dayGz)) return null
  const { year, month, hour } = ctx.pillars
  const otherZhis: string[] = [year.zhi, month.zhi, hour.zhi]
  // md 条件 5: 贵人日支不被冲
  const dzChong = CHONG_PAIR[ctx.dayZhi as string]
  if (dzChong && otherZhis.includes(dzChong)) return null
  // md 条件 5: 贵人日支不被"合去" (合化为他物)；简化：若合而化他——TODO 合化判断
  // 此处仅标注 "带合" 加分 (不破格)
  const heZhi = HE_OF_RIGUI[ctx.dayZhi as string]
  const hasHe = heZhi && otherZhis.includes(heZhi)
  // md 条件 7 (加重): 不遇大运流年冲破合害 → 岁运敏感
  return {
    name: '日贵格',
    note: `日柱 ${ctx.dayGz} · 贵人不冲${hasHe ? '·带合牢固' : ''}`,
    suiyunSpecific: true,
  }
}
