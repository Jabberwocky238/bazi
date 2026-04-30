import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/**
 * 稼穑格：戊己土日主专旺 + 月令辰戌丑未 + 财透 ≤ 1 (水不多冲土)。
 *
 * 变体 (guigeVariant, 依 md)：
 *  - 稼穑毓秀：稼穑 + 一点金点缀 (有金透 / 金支) — "厚重里长出的光"，最佳形态。
 *  - 无变体：纯土稼穑，偏沉闷但仍成格。
 *
 * 【岁运】md 内容.md "大运走木水 → 破格":
 *   - 大运 / 流年透木 (官杀克土) → 破格 (suiyunBreak)。
 *   - 大运 / 流年走水 (财冲土库) → 破格。
 *   - 破格大运过后才重新稳回。
 *   当前 detector 仅扫主柱土气, 未把岁运木水叠加。
 */
export function isJiaSeGe(): GejuHit | null {
  const bazi = readBazi()
  if (bazi.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(bazi.monthZhi)) return null
  const r = checkZhuanWang('土', 1)
  if (!r) return null
  const jinN = bazi.ganWxCount('金') + bazi.zhiMainWxCount('金')
  const hasJin = jinN > 0
  return {
    name: '稼穑格',
    note: `月令 ${bazi.monthZhi} ; ${r.note}${hasJin ? ` · 金点缀 ${jinN} 位` : ''}`,
    ...(hasJin ? { guigeVariant: '稼穑毓秀' } : {}),
  }
}
