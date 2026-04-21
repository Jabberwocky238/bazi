import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 木疏厚土：土日主 + 土极厚 + 木有根能疏 + 木不过旺 + 无重金克木。 */
export function isMuShuHouTu(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  if (ctx.zhiMainWxCount('土') < 2) return null
  if (ctx.ganWxCount('土') < 1) return null
  if (!ctx.touWx('木')) return null
  if (!ctx.rootExt('木')) return null
  if (ctx.ganWxCount('木') > 2) return null
  if (ctx.ganWxCount('金') >= 2) return null
  return { name: '木疏厚土', note: '土厚 · 木透有根疏土 · 无重金克木' }
}
