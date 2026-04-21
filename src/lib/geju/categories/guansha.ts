import type { Ctx } from '../ctx'
import type { GejuHit } from '../types'

/**
 * 官杀混杂：正官与七杀同时存在，**至少一方透干**。
 *   - 显混杂 = 两者俱透干（最典型）
 *   - 隐混杂 = 一透一藏
 *   - 均藏 → md 未列为破格，本 detector 不识别
 */
export function isGuanShaHunZa(ctx: Ctx): GejuHit | null {
  if (!ctx.has('正官') || !ctx.has('七杀')) return null
  const bothTou = ctx.tou('正官') && ctx.tou('七杀')
  const oneTou = ctx.tou('正官') || ctx.tou('七杀')
  if (!oneTou) return null
  return {
    name: '官杀混杂',
    note: bothTou ? '正官 + 七杀 天干双透 (显混杂)' : '正官 / 七杀 一透一藏 (隐混杂)',
  }
}

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
  // md 条件 1: 七杀透通根 OR 月令**本气**七杀
  const monthMainSha = ctx.pillars[1].hideShishen[0] === '七杀'
  const shaTouRoot = ctx.tou('七杀') && ctx.zang('七杀')
  if (!monthMainSha && !shaTouRoot) return null
  if (ctx.tou('正官')) return null
  // md 条件 2: 印透通根
  if (!ctx.touCat('印')) return null
  if (!(ctx.zang('正印') || ctx.zang('偏印'))) return null
  // md 条件 3: 七杀→印→日主紧贴。印须在月干或时干 (紧贴日主)
  const yinAdjRi =
    ctx.pillars[1].shishen === '正印' || ctx.pillars[1].shishen === '偏印' ||
    ctx.pillars[3].shishen === '正印' || ctx.pillars[3].shishen === '偏印'
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
