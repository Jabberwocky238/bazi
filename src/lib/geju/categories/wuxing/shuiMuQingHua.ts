import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

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
