import {
  WX_GENERATED_BY,
  WX_CONTROLLED_BY,
  WX_CONTROLS,
  type Ctx,
} from '../ctx'
import type { GejuHit, ShishenCat } from '../types'

/**
 * 从X 共用判据（依《滴天髓》"若有一毫印绶，即不为从"）：
 * - 日主**无任何比劫 / 印根**（天干无比印透，四柱藏干无比印）
 * - 月令为目标类别 OR 目标在地支主气 ≥ 3
 * - 目标类别透干
 */
function checkCong(ctx: Ctx, target: ShishenCat, targetWx: string): { note: string } | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (!ctx.touCat(target)) return null
  const monthIs = ctx.monthCat === target
  const zhiSupport = ctx.zhiMainWxCount(targetWx)
  if (!monthIs && zhiSupport < 3) return null
  return {
    note: `日主无根 (0 比劫印)，${monthIs ? `月令${target}` : `地支 ${targetWx} ${zhiSupport} 位`}`,
  }
}

/** 从财格 —— md：「财星数量 ≥ 食伤」「财星数量 > 官杀」。 */
export function isCongCaiGe(ctx: Ctx): GejuHit | null {
  const caiWx = WX_CONTROLS[ctx.dayWx]
  const r = checkCong(ctx, '财', caiWx)
  if (!r) return null
  if (ctx.countCat('财') < ctx.countCat('食伤')) return null
  if (ctx.countCat('财') <= ctx.countCat('官杀')) return null
  return { name: '从财格', note: r.note }
}

/** 从杀格 —— md：「官杀数量 ≥ 财星」「官杀数量 > 食伤」+ 「无食伤克官杀」。 */
export function isCongShaGe(ctx: Ctx): GejuHit | null {
  const ksWx = WX_CONTROLLED_BY[ctx.dayWx]
  const r = checkCong(ctx, '官杀', ksWx)
  if (!r) return null
  if (ctx.countCat('官杀') < ctx.countCat('财')) return null
  if (ctx.countCat('官杀') <= ctx.countCat('食伤')) return null
  if (ctx.touCat('食伤')) return null
  return { name: '从杀格', note: r.note }
}

/**
 * 从儿格：日主无根 + 食伤成势 + 无印 + 无官杀 + 无比劫帮身。
 * 《滴天髓·从儿》"从儿不管身强弱，只要吾儿又遇儿"；"从儿最忌官杀，次忌印绶"。
 */
export function isCongErGe(ctx: Ctx): GejuHit | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (ctx.countCat('官杀') > 0) return null
  if (!ctx.touCat('食伤')) return null
  const ssWx = WX_GENERATED_BY[ctx.dayWx]
  const monthIs = ctx.monthCat === '食伤'
  const zhiN = ctx.zhiMainWxCount(ssWx)
  if (!monthIs && zhiN < 3) return null
  // md 条件 4: 食伤 > 财 (财多则变从势)
  if (ctx.countCat('食伤') <= ctx.countCat('财')) return null
  return {
    name: '从儿格',
    note: `无比劫印官，食伤成势 (${monthIs ? '月令食伤' : `地支 ${ssWx} ${zhiN} 位`}) · 食伤 > 财`,
  }
}

/**
 * 从官格（依 md 7 条）：
 *  1. 极弱无根。
 *  2. 月令为正官 (本气)。
 *  3. 正官 ≥ 财 && > 食伤；不混七杀。
 *  4. 无食伤。
 *  5. 无印。
 *  6. 无比劫。
 */
export function isCongGuanGe(ctx: Ctx): GejuHit | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (ctx.countCat('食伤') > 0) return null
  if (!ctx.tou('正官')) return null
  if (ctx.tou('七杀')) return null
  // md 条件 2: 月令本气正官 (或 monthCat === '官杀' 配合透正官)
  if (ctx.monthCat !== '官杀') return null
  // md 条件 3: 正官数量 ≥ 财
  if (ctx.countOf('正官') < ctx.countCat('财')) return null
  const gwWx = WX_CONTROLLED_BY[ctx.dayWx]
  if (ctx.zhiMainWxCount(gwWx) < 2) return null
  return { name: '从官格', note: `无比印食伤，月令正官通根 ${gwWx} ≥ 2 位` }
}

/**
 * 从旺格（依 md 4 条 + 亚型区分）：
 *  1. 比劫 + 印主导，月令本气为比印，总位 ≥ 5 (条件 1)。
 *  2. 无官杀 (条件 2)。
 *  3. 财星不紧贴印 (条件 3，紧贴才破)。
 *  4. 食伤 ≤ 1 位 (条件 4，多则重泄破)。
 *  5. 比劫 ≥ 印（与从强格区分）。
 */
export function isCongWangGe(ctx: Ctx): GejuHit | null {
  if (!ctx.deLing) return null
  const support = ctx.countCat('比劫') + ctx.countCat('印')
  if (support < 5) return null
  if (ctx.countCat('官杀') > 0) return null
  // md 条件 3: 财紧贴印破 (其余远离可容)
  const caiAdjYin =
    ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('正财', '偏印') ||
    ctx.adjacentTou('偏财', '正印') || ctx.adjacentTou('偏财', '偏印')
  if (caiAdjYin) return null
  // md 条件 4: 食伤不重泄
  if (ctx.countCat('食伤') > 1) return null
  // md 条件 5: 从旺（比劫 ≥ 印）—— 印多反为从强
  if (ctx.countCat('比劫') < ctx.countCat('印')) return null
  return {
    name: '从旺格',
    note: `比印合 ${support} 位主导，比劫 ≥ 印，无官杀无紧贴财破`,
  }
}

/**
 * 从势格（依 md 4 条）：
 *  1. 极弱无根。
 *  2. 三党 (食伤/财/官杀) **都有且力量相近**，无一方独大。
 *  3. 无印无比劫。
 *  4. 月令可食伤/财/官杀，不可比/印。
 */
export function isCongShiGe(ctx: Ctx): GejuHit | null {
  if (ctx.countCat('比劫') > 0) return null
  if (ctx.countCat('印') > 0) return null
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  const categories = ['食伤', '财', '官杀'] as const
  const counts = categories.map((c) => ctx.countCat(c))
  // md 条件 2: 三党都有且力量相近 (差距不超过 2)
  if (counts.some((n) => n < 1)) return null
  const diff = Math.max(...counts) - Math.min(...counts)
  if (diff > 2) return null
  const active = categories.filter((c) => ctx.touCat(c))
  return { name: '从势格', note: `无根 · 月令非印比 · ${active.join('/')} 三党势均` }
}

/**
 * 从强格 (md)：印星力量 > 比劫 + 月令为印或比劫 + 全局皆印比 + 无食伤财官杀。
 * md 明文：「四柱印绶重重，比劫叠叠」「印星力量 > 比劫」
 *        「没有食伤财星官杀任何一党」。
 * 与从旺格差异：从旺格 比劫 ≥ 印，从强格 印 > 比劫。
 */
export function isCongQiangGe(ctx: Ctx): GejuHit | null {
  if (!ctx.deLing) return null
  const yinN = ctx.countCat('印')
  const biN = ctx.countCat('比劫')
  if (yinN <= biN) return null
  if (yinN + biN < 5) return null
  if (ctx.countCat('食伤') > 0) return null
  if (ctx.countCat('财') > 0) return null
  if (ctx.countCat('官杀') > 0) return null
  return { name: '从强格', note: `印 ${yinN} > 比劫 ${biN} 主导，全局皆印比` }
}
