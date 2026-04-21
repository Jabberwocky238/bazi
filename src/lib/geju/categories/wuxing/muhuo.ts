import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 木火相煎：木日主 + 火过旺 + 木根虚 + 无水。 */
export function isMuHuoXiangJian(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  const huoMany = ctx.ganWxCount('火') >= 2 || ctx.zhiMainWxCount('火') >= 2
  if (!huoMany) return null
  if (ctx.zhiMainWxCount('木') > 1) return null
  if (ctx.touWx('水') || ctx.rootWx('水')) return null
  return { name: '木火相煎', note: '火过旺而木根虚，无水润' }
}

/**
 * 木火通明：木日主 + 火透+火根 + 木根(含中气) + 无重金 + 无重水。
 * 互斥：水透+水有根 → 水木清华。
 */
export function isMuHuoTongMing(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  const shuiRooted = ctx.touWx('水') && ctx.rootWx('水')
  if (shuiRooted) return null
  if (!ctx.touWx('火')) return null
  if (!ctx.rootWx('火')) return null
  if (!ctx.rootExt('木')) return null
  if (ctx.ganWxCount('金') >= 2) return null
  return { name: '木火通明', note: '木生火，火透坐巳午本气根，无重金重水' }
}

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
