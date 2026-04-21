import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 水多木漂：木日主 + 水过旺 + 木无根 + 无土 + 无火。 */
export function isShuiDuoMuPiao(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  const shuiMany = ctx.ganWxCount('水') >= 2 || ctx.zhiMainWxCount('水') >= 3
  if (!shuiMany) return null
  if (ctx.zhiMainWxCount('木') !== 0) return null
  if (ctx.touWx('土')) return null
  if (ctx.touWx('火')) return null
  return { name: '水多木漂', note: '水盛 · 木无根 · 无土制水无火泄木' }
}

/** 水冷木寒：木日主 + 冬 + 水多 + 无火 + 无土。 */
export function isShuiLengMuHan(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '木') return null
  if (ctx.season !== '冬') return null
  if (ctx.ganWxCount('水') < 2 && ctx.zhiMainWxCount('水') < 2) return null
  if (ctx.touWx('火')) return null
  if (ctx.touWx('土')) return null
  return { name: '水冷木寒', note: '冬月水旺 · 无火调候 · 无土制水' }
}

/**
 * 水木清华：水+木透 + 无金 + 土主气<2 + 水木比例合宜 (水 ≤ 木*2)。
 * 互斥：火透且有根 (含中气) → 让位木火通明。
 */
export function isShuiMuQingHua(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '水' && ctx.dayWx !== '木') return null
  if (!ctx.touWx('水') || !ctx.touWx('木')) return null
  if (ctx.touWx('金')) return null
  if (ctx.zhiMainWxCount('土') >= 2) return null
  if (ctx.touWx('火') && ctx.rootExt('火')) return null
  const shuiN = ctx.ganWxCount('水') + ctx.zhiMainWxCount('水')
  const muN = ctx.ganWxCount('木') + ctx.zhiMainWxCount('木')
  if (muN === 0) return null
  if (shuiN > muN * 2) return null
  return { name: '水木清华', note: '水生木且木透，水木比例合宜，无金克无重土塞水' }
}
