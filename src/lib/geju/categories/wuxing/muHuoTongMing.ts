import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

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
