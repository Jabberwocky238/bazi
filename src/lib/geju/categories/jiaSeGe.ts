import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/**
 * 稼穑格：戊己土日主专旺 + 月令辰戌丑未 + 财透 ≤ 1 (水不多冲土)。
 *
 * 变体 (guigeVariant, 依 md)：
 *  - 稼穑毓秀：稼穑 + 一点金点缀 (有金透 / 金支) — "厚重里长出的光"，最佳形态。
 *  - 无变体：纯土稼穑，偏沉闷但仍成格。
 */
export function isJiaSeGe(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(ctx.monthZhi)) return null
  const r = checkZhuanWang(ctx, '土', 1)
  if (!r) return null
  const jinN = ctx.ganWxCount('金') + ctx.zhiMainWxCount('金')
  const hasJin = jinN > 0
  return {
    name: '稼穑格',
    note: `月令 ${ctx.monthZhi} ; ${r.note}${hasJin ? ` · 金点缀 ${jinN} 位` : ''}`,
    ...(hasJin ? { guigeVariant: '稼穑毓秀' } : {}),
  }
}
