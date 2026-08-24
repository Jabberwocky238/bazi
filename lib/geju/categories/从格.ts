import { GejuContext } from '../types'
import {
  SHI_SHEN_CAT,
  WX_CONTROLS,
  WX_CONTROLLED_BY,
  WX_GENERATED_BY,
  type GejuHit,
} from '../types'
import { emitGeju } from '../_emit'
import type { ShishenCat, WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从X 共用判据 — 与 bazi-skills《格局/从格》对照:
 *
 *  bazi-skills 4 条 (从弱派, 严格版):
 *   1. 天干不透比劫 / 印                         [岁运透比劫/印 → 复根 Break]
 *   2. 地支 (含藏干) 不见比劫 / 印               [静态: 地支无根]
 *   3. 目标类别透干                              [可被岁运补: 岁运透 target → Trigger]
 *   4. 月令属 target (从神当令)                  [静态]
 *
 *  返回 CongResult — 由各子格 detector 喂给 emitGeju 决定:
 *    - 主局成 + 岁运不透比劫印     → 显
 *    - 主局成 + 岁运透比劫 / 印   → 显 + Break (复根破从)
 *    - 主局缺 target 透 + 岁运补  → 隐 + Trigger
 */
interface CongResult {
  baseFormed: boolean
  withExtrasFormed: boolean
  hasExtras: boolean
  note: string
}

function checkCong(ctx: GejuContext, target: ShishenCat, targetWx: string): CongResult | null {
  const extras = ctx.extras

  // —— 条件 2: 地支不见比劫 / 印 (静态) ——
  if (ctx.allZhiArr.some((s) => SHI_SHEN_CAT[s] === '比劫')) return null
  if (ctx.allZhiArr.some((s) => SHI_SHEN_CAT[s] === '印')) return null

  // —— 条件 4: 月令属 target (静态) ——
  if (ctx.monthCat !== target) return null
  // 地支主气 target 五行 ≥ 1 位
  const zhiSupport = ctx.zhiMainWxCount(targetWx as WuXing)
  if (zhiSupport < 1) return null

  // —— 条件 1: 天干不透比劫 / 印 (主局严判 + 岁运 Break) ——
  const baseClean1 = !ctx.touCat('比劫') && !ctx.touCat('印')
  const extClean1 = baseClean1 && !extras.touCat('比劫') && !extras.touCat('印')

  // —— 条件 3: 目标透干 (主局 / 岁运补) ——
  const baseStruct3 = ctx.touCat(target)
  const extStruct3 = baseStruct3 || extras.touCat(target)

  const baseFormed = baseClean1 && baseStruct3
  const withExtrasFormed = extClean1 && extStruct3

  if (!baseFormed && !withExtrasFormed) return null

  return {
    baseFormed,
    withExtrasFormed,
    hasExtras: extras.active,
    note: `${baseClean1 ? '天干无印比' : '岁运透印比'} · 地支无印比根气 · 月令从${target} · 主气 ${targetWx} ${zhiSupport} 位`,
  }
}

/**
 * 弃命从财 (从弱派) — 财类数量 ≥ 食伤 且 ≥ 3 位.
 *  checkCong 处理: 月令从财 / 地支无印比 / 天干印比 base+extras 双判 / 财透 base+extras 双判
 *  本段: 量化阈值 (主局 only)
 *  岁运透比劫/印 → 复根 Break (由 checkCong 处理)
 */
function isCongCaiGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const caiWx = WX_CONTROLS[ctx.dayWx]
  const r = checkCong(ctx, '财', caiWx)
  if (!r) return null
  const caiN = ss.countCat('财')
  if (caiN < 3) return null
  if (caiN < ss.countCat('食伤')) return null
  return emitGeju(
    { name: '弃命从财', note: `${r.note}，财 ${caiN} 位` },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}

/**
 * 弃命从煞 — 官杀数量 ≥ 5 + 官杀 ≥ 财星 + 官杀 > 食伤 + 无食伤克官杀.
 *  checkCong: 月令从杀 / 地支无印比 / 天干印比 base+extras / 杀透 base+extras
 *  本段: 量化 + 无食伤透 (岁运透食伤 → Break)
 */
function isCongShaGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const extras = ctx.extras
  const ksWx = WX_CONTROLLED_BY[ctx.dayWx]
  const r = checkCong(ctx, '官杀', ksWx)
  if (!r) return null
  const gsN = ss.countCat('官杀')
  if (gsN < 5) return null
  if (gsN < ss.countCat('财')) return null
  if (gsN <= ss.countCat('食伤')) return null
  if (ctx.touCat('食伤')) return null

  const baseFormed = r.baseFormed
  const withExtrasFormed = r.withExtrasFormed && !extras.touCat('食伤')

  return emitGeju(
    { name: '弃命从煞', note: `${r.note}，官杀 ${gsN} 位主导` },
    { baseFormed, withExtrasFormed, hasExtras: r.hasExtras },
  )
}

/**
 * 弃命从势 — 严格依《滴天髓·从象》任铁樵注:
 *   1. 日主无根 — 天干无比印, 地支本气/中气/余气皆无比劫/印 (任一藏即破)
 *   2. 财 / 官杀 / 食伤 三者中 ≥ 2 种强势并立 (透干 + 通根)
 *   3. 顺流通关 — 食伤→财 或 财→官杀 至少一链
 *   4. 无印 (透或藏)              — 已并入条件 1
 *   5. 无比劫 (透或藏)            — 已并入条件 1
 *
 *  【岁运】岁运透比劫 / 印 → Break (复根破从)。
 */
function isCongShiGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const extras = ctx.extras

  // —— 条件 1 + 4 + 5: 日主完全无根 (无比印任一位置) ——
  if (ctx.touCat('比劫')) return null
  if (ctx.touCat('印')) return null
  // 全 4 柱所有藏干 (本/中/余气) 皆不得为 比劫 / 印
  const allHide = ctx.allZhiArr
  if (allHide.some((s) => SHI_SHEN_CAT[s] === '比劫')) return null
  if (allHide.some((s) => SHI_SHEN_CAT[s] === '印')) return null

  // —— 条件 2: 三党中 ≥ 2 种强势 (透干 + 地支通根) ——
  const strongCai = ctx.touCat('财') && (ss.zang('正财')[0] || ss.zang('偏财')[0])
  const strongGS = ctx.touCat('官杀') && (ss.zang('正官')[0] || ss.zang('七杀')[0])
  const strongSS = ctx.touCat('食伤') && (ss.zang('食神')[0] || ss.zang('伤官')[0])
  const strongN = (strongCai ? 1 : 0) + (strongGS ? 1 : 0) + (strongSS ? 1 : 0)
  if (strongN < 2) return null

  // —— 条件 3: 顺流通关 — 食伤→财 或 财→官杀 至少一链 ——
  const linkSC = strongSS && strongCai
  const linkCG = strongCai && strongGS
  if (!linkSC && !linkCG) return null

  // 岁运透 比劫 / 印 → Break
  const baseFormed = true
  const withExtrasFormed = !extras.touCat('比劫') && !extras.touCat('印')

  const tags = [
    strongSS ? '食伤' : '',
    strongCai ? '财' : '',
    strongGS ? '官杀' : '',
  ].filter(Boolean)
  return emitGeju(
    {
      name: '弃命从势',
      note: `日主无根 · 无比印 · ${tags.join('+')} 强势并立${linkSC ? ' · 食伤生财' : ''}${linkCG ? ' · 财生官杀' : ''}`,
    },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

/**
 * 从儿格 — 日主无根 + 食伤成势 + 无印 + 无官杀 + 无比劫帮身.
 *
 * 《滴天髓·从儿》"从儿不管身强弱，只要吾儿又遇儿"；"从儿最忌官杀，次忌印绶".
 *
 *  - 主局严判量化 + 清纯 (静态)
 *  - 岁运透官杀 / 印 / 比劫 → Break (复根 / 克儿)
 *  - 主局缺食伤透 + 岁运透食伤 → Trigger
 */
function isCongErGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const extras = ctx.extras

  if (ctx.touCat('比劫')) return null
  if (ctx.touCat('印')) return null
  if (ctx.touCat('官杀')) return null
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  const ssWx = WX_GENERATED_BY[ctx.dayWx] as WuXing
  const zhiN = ctx.zhiMainWxCount(ssWx)
  if (zhiN < 2) return null
  const ssN = ss.countCat('食伤')
  if (ssN < 4) return null
  if (ssN <= ss.countCat('财')) return null

  // 主局缺食伤透 + 岁运补 → Trigger
  const baseStruct = ctx.touCat('食伤')
  const extStruct = baseStruct || extras.touCat('食伤')

  // 岁运透 比劫 / 印 / 官杀 → Break
  const baseClean = true
  const extClean = baseClean && !extras.touCat('比劫') && !extras.touCat('印') && !extras.touCat('官杀')

  const baseFormed = baseStruct && baseClean
  const withExtrasFormed = extStruct && extClean

  return emitGeju(
    {
      name: '从儿格',
      note: `天干无印比官，食伤 ${ssN} 位 (地支 ${ssWx} ${zhiN} 位) · 食伤 > 财`,
    },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
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
function isCongGuanGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  if (ss.countCat('比劫') > 0) return null
  if (ss.countCat('印') > 0) return null
  if (ss.countCat('食伤') > 0) return null
  if (!ss.tou('正官')[0]) return null
  if (ss.tou('七杀')[0]) return null
  // md 条件 2: 月令本气正官 (或 monthCat === '官杀' 配合透正官)
  if (ctx.monthCat !== '官杀') return null
  // md 条件 3: 正官数量 ≥ 财
  if (ctx.countOf('正官') < ss.countCat('财')) return null
  const gwWx = WX_CONTROLLED_BY[ctx.dayWx] as WuXing
  if (ctx.zhiMainWxCount(gwWx) < 2) return null
  return { name: '从官格', note: `无比印食伤，月令正官通根 ${gwWx} ≥ 2 位` }
}

/**
 * 从强格 (md)：印星力量 > 比劫 + 月令为印或比劫 + 全局皆印比 + 无食伤财官杀。
 * md 明文：「四柱印绶重重，比劫叠叠」「印星力量 > 比劫」
 *        「没有食伤财星官杀任何一党」。
 * 与从旺格差异：从旺格 比劫 ≥ 印，从强格 印 > 比劫。
 */
function isCongQiangGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  if (!ctx.strength.deLing) return null
  const yinN = ss.countCat('印')
  const biN = ss.countCat('比劫')
  if (yinN <= biN) return null
  if (yinN + biN < 5) return null
  if (ss.countCat('食伤') > 0) return null
  if (ss.countCat('财') > 0) return null
  if (ss.countCat('官杀') > 0) return null
  return { name: '从强格', note: `印 ${yinN} > 比劫 ${biN} 主导，全局皆印比` }
}

/**
 * 从旺格（依 md 4 条 + 亚型区分）：
 *  1. 比劫 + 印主导，月令本气为比印，总位 ≥ 5 (条件 1)。
 *  2. 无官杀 (条件 2)。
 *  3. 财星不紧贴印 (条件 3，紧贴才破)。
 *  4. 食伤 ≤ 1 位 (条件 4，多则重泄破)。
 *  5. 比劫 ≥ 印（与从强格区分）。
 */
function isCongWangGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  if (!ctx.strength.deLing) return null
  const support = ss.countCat('比劫') + ss.countCat('印')
  if (support < 5) return null
  if (ss.countCat('官杀') > 0) return null
  // md 条件 3: 财紧贴印破 (其余远离可容)
  const caiAdjYin =
    ss.adjacentTou('正财', '正印') || ss.adjacentTou('正财', '偏印') ||
    ss.adjacentTou('偏财', '正印') || ss.adjacentTou('偏财', '偏印')
  if (caiAdjYin) return null
  // md 条件 4: 食伤不重泄
  if (ss.countCat('食伤') > 1) return null
  // md 条件 5: 从旺（比劫 ≥ 印）—— 印多反为从强
  if (ss.countCat('比劫') < ss.countCat('印')) return null
  return {
    name: '从旺格',
    note: `比印合 ${support} 位主导，比劫 ≥ 印，无官杀无紧贴财破`,
  }
}

export function isCongGe(ctx: GejuContext): GejuHit | null {
  const hit =
    isCongCaiGe(ctx) ||
    isCongShaGe(ctx) ||
    isCongShiGe(ctx) ||
    isCongErGe(ctx)
  return hit ? { ...hit, name: '从格', note: `${hit.name} · ${hit.note}` } : null
}
