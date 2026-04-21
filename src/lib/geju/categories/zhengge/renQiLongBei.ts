import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 壬骑龙背（依 md 4 条）。 */
export function isRenQiLongBei(ctx: Ctx): GejuHit | null {
  if (ctx.dayGz !== '壬辰') return null
  const hasXu = ctx.mainArr.some((p) => p.zhi === '戌')
  if (hasXu) return null
  const { year, month, hour } = ctx.pillars
  const otherRen = [year, month, hour].some((p) => p.gan === '壬')
  const otherChen = ([year.zhi, month.zhi, hour.zhi] as string[]).includes('辰')
  const hasJin = ctx.touWx('金') || ctx.rootWx('金')
  const hasMu = ctx.touWx('木')
  if (!otherRen && !otherChen && !hasJin && !hasMu) return null
  if (ctx.ganWxCount('火') >= 2) return null
  if (ctx.ganWxCount('土') >= 2) return null
  return {
    name: '壬骑龙背',
    note: `日柱壬辰${otherRen ? '+壬' : ''}${otherChen ? '+辰' : ''}${hasJin ? '+金生' : ''}${hasMu ? '+木泄' : ''}`,
  }
}
