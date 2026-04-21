import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 官印相生：正官 + 印 双透通根 + 位置连贯（官印紧贴）+ 无七杀透 + 无伤官透 + 无财紧贴破印。
 * md 明文："正官透干通根；印透干通根；位置连贯"；"财最忌紧贴克印"。
 */
export function isGuanYinXiangSheng(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('正官')) return null
  if (!ctx.zang('正官')) return null
  if (ctx.tou('七杀')) return null                              // md: 杀透则破 (藏可容)
  if (!ctx.touCat('印')) return null
  if (!(ctx.zang('正印') || ctx.zang('偏印'))) return null
  const adjOfficial =
    ctx.adjacentTou('正官', '正印') || ctx.adjacentTou('正官', '偏印')
  if (!adjOfficial) return null
  if (ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
      ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')) return null
  // md 条件 4: 日主非极弱
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  // md 条件 5: 伤官紧贴克官且无印护才破
  if (ctx.tou('伤官') && ctx.adjacentTou('伤官', '正官') && !ctx.touCat('印')) return null
  return { name: '官印相生', note: '正官印双透通根紧贴，身可任，无紧贴财/伤破局' }
}
