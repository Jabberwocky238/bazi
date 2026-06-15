import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 杀印相生：七杀透干或月令七杀 + 印透干。
 * 允许正官藏支（不透则不算混杂）。
 *
 * 互斥条件：**伤官合杀成立时七杀已被合去，无杀可化**。
 * 依《子平真诠·论七杀》"杀用印则不用食伤，杀用食伤则不用印"——
 * 七杀用神排他；《子平真诠·论伤官》"合杀者，取其合以去杀"——
 * 合后杀已不独立存在，不能再论相生。
 */
export function isShaYinXiangSheng(ctx: Ctx): GejuHit | null {
  // md 条件 1: 七杀存在于命局 (月令本气 OR 透 OR 任一位藏)
  const monthMainSha = ctx.pillars.month.hideShishen[0] === '七杀'
  const shaPresent = ctx.tou('七杀') || ctx.zang('七杀')
  if (!monthMainSha && !shaPresent) return null
  if (ctx.tou('正官')) return null
  // md 条件 2: 印透通根
  if (!ctx.touCat('印')) return null
  if (!(ctx.zang('正印') || ctx.zang('偏印'))) return null
  // md 条件 3: 七杀→印→日主紧贴。印须在月干或时干 (紧贴日主)
  const yinAdjRi =
    ctx.pillars.month.shishen === '正印' || ctx.pillars.month.shishen === '偏印' ||
    ctx.pillars.hour.shishen === '正印' || ctx.pillars.hour.shishen === '偏印'
  if (!yinAdjRi) return null
  if (ctx.tou('七杀')) {
    const adj = ctx.adjacentTou('七杀', '正印') || ctx.adjacentTou('七杀', '偏印')
    if (!adj) return null
  }
  // md 条件 4: 无财紧贴克印
  if (ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
      ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')) return null
  // md 条件 5: 日主非极弱
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  // 伤官合杀互斥
  if (!ctx.dayYang && ctx.tou('伤官') && ctx.tou('七杀') &&
      ctx.adjacentTou('伤官', '七杀')) {
    return null
  }
  return { name: '杀印相生', note: '七杀透根 · 印紧贴日主化杀 · 无财破无极弱' }
}
