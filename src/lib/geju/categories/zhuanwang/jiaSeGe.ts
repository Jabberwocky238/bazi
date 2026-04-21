import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/** 稼穑格：戊己土日主专旺 + 月令辰戌丑未 + 财透 ≤ 1 (水不多冲土)。 */
export function isJiaSeGe(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(ctx.monthZhi)) return null
  const r = checkZhuanWang(ctx, '土', 1)
  return r ? { name: '稼穑格', note: `月令 ${ctx.monthZhi} ; ${r.note}` } : null
}
