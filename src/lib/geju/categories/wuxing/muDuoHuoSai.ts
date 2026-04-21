import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 木多火塞：火日主 + 地支木≥3 + 火无根/弱 + 无金疏通。 */
export function isMuDuoHuoSai(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '火') return null
  if (ctx.zhiMainWxCount('木') < 3) return null
  const huoWeak = !ctx.rootWx('火') || ctx.zhiMainWxCount('火') < 2
  if (!huoWeak) return null
  const wuJin = !ctx.touWx('金') || ctx.ganWxCount('金') < 2
  if (!wuJin) return null
  return { name: '木多火塞', note: '木多压火 · 火弱无根 · 无金疏通' }
}
