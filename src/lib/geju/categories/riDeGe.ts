import { CHONG_PAIR, type Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 日德格（依《三命通会·论日德》4 条 + 1 条魁罡破格）：
 *  1. 日柱为甲寅/丙辰/戊辰/庚辰/壬戌。
 *  2. 日德**叠见**：年/月/时柱至少再有一位日德干支。
 *  3. 日支不被冲；不落空亡（空亡暂缺 API）。
 *  4. 原局无刑破、无七杀紧贴日主、无阳刃犯。
 *  5. 原局不见相应魁罡克日德（各日德专配忌魁罡）。
 *     **【岁运相关，suiyunBreak】**：大运流年遇忌魁罡亦破，待 ctx 扩展。
 */
const RI_DE = new Set(['甲寅', '丙辰', '戊辰', '庚辰', '壬戌'])

/** 各日德所忌魁罡（MD 条件 5 表） */
const RI_DE_FORBIDDEN_KUIGANG: Record<string, string[]> = {
  甲寅: ['庚辰'],
  丙辰: ['壬辰'],
  戊辰: ['壬戌'],       // 戊辰近魁罡结构，只注壬戌冲
  庚辰: ['庚戌', '甲寅'],
  壬戌: ['戊戌'],
}

export function isRiDeGe(ctx: Ctx): GejuHit | null {
  if (!RI_DE.has(ctx.dayGz)) return null
  const { year, month, hour } = ctx.pillars
  const otherGzs = [
    year.gan + year.zhi,
    month.gan + month.zhi,
    hour.gan + hour.zhi,
  ]
  // md 条件 2: 叠见
  if (!otherGzs.some((gz) => RI_DE.has(gz))) return null
  // md 条件 3: 日支不冲
  const dzChong = CHONG_PAIR[ctx.dayZhi as string]
  if (dzChong && [year.zhi, month.zhi, hour.zhi].includes(dzChong as never)) {
    return null
  }
  // md 条件 4: 无紧贴七杀
  if (ctx.tou('七杀') && (
    month.shishen === '七杀' || hour.shishen === '七杀'
  )) return null
  // md 条件 5: 不犯相应魁罡
  const forbiddenKuigang = RI_DE_FORBIDDEN_KUIGANG[ctx.dayGz] ?? []
  if (otherGzs.some((gz) => forbiddenKuigang.includes(gz))) return null
  // md 条件 5 尾: "大运流年遇到亦有大灾" → 岁运敏感
  return {
    name: '日德格',
    note: `日柱 ${ctx.dayGz} · 叠见日德 · 日支不冲 · 无忌魁罡`,
    suiyunSpecific: true,
  }
}
