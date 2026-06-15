import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/** 土重金埋（放宽版）：金日主 + 土势压金 + 金虚 + 无有力木/水救。 */
export function isTuZhongJinMai(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  // 土势：地支本气土 ≥ 3 位 或 土透≥2
  const tuHeavy = ctx.zhiMainWxCount('土') >= 3 || ctx.ganWxCount('土') >= 2
  if (!tuHeavy) return null
  // 金虚：无本气根
  if (ctx.rootWx('金')) return null
  // 木救：木透+通根 才算有力 (单透不算)
  if (ctx.touWx('木') && ctx.rootWx('木')) return null
  // 水救：水透+通根 才算
  if (ctx.touWx('水') && ctx.rootWx('水')) return null
  return { name: '土重金埋', note: '土势压金 · 金虚无根 · 无有力木/水救' }
}
