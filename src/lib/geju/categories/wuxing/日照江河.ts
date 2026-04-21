import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 日照江河 (不成对的特殊象法)：丙日主 + 丙火有根 + 水旺流通 + 无厚土拦水。
 * md: "丙火坐地支火根"；"水气有进有出"；"无土拦水"。
 */
export function judgeRiZhao(ctx: Ctx): GejuHit | null {
  if (ctx.dayGan !== '丙') return null
  if (!ctx.touWx('水')) return null
  if (!ctx.rootExt('火')) return null
  const waterStrong = ctx.zhiMainWxCount('水') >= 2 || ctx.ganWxCount('水') >= 2
  if (!waterStrong) return null
  if (ctx.ganWxCount('土') >= 2) return null
  return { name: '日照江河', note: '丙火有根 (含寅中丙)，水旺流通' }
}
