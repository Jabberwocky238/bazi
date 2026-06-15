import { WX_GENERATED_BY, type Ctx } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 专旺共用判据（依 md 5-6 条，五专旺格通用）：
 *  1. 日主属 targetWx。
 *  2. 地支支持：本五行 + 印星本气 ≥ 3 位（近似三合/三会成局）。
 *  3. 天干另见一位同五行（日主外）。
 *  4. 无官杀透克身。
 *  5. 食伤 (耗气) 不过重：countCat('食伤') < 3。
 *  6. 财星：透数 ≤ maxCaiTou；稼穑尤严（水多冲土）总位亦 < 2。
 */
export function checkZhuanWang(
  ctx: Ctx,
  targetWx: string,
  maxCaiTou = Infinity,
): { note: string } | null {
  if (ctx.dayWx !== targetWx) return null
  if (!ctx.deLing) return null
  const selfWx = ctx.dayWx
  const yinWx = WX_GENERATED_BY[selfWx] as WuXing
  // 本气 + 中气都算支持位 (放宽)
  const supportZhi =
    ctx.zhiMainWxCount(selfWx) + ctx.zhiMainWxCount(yinWx) +
    (ctx.rootExt(selfWx as WuXing) ? 1 : 0) +
    (ctx.rootExt(yinWx) ? 1 : 0)
  if (supportZhi < 3) return null
  if (ctx.touCat('官杀')) return null
  if (ctx.ganWxCount(targetWx as WuXing) < 2) return null
  // md 条件 5: 食伤重泄破 (放宽到 4)
  if (ctx.countCat('食伤') >= 4) return null
  const caiTouN =
    (ctx.tou('正财') ? 1 : 0) + (ctx.tou('偏财') ? 1 : 0)
  if (caiTouN > maxCaiTou) return null
  if (maxCaiTou <= 1) {
    // 稼穑：忌水冲土 —— 透 + 地支主气 (不计余气/中气) 合计 < 2 才放行
    const caiMainZhi = ctx.mainZhiArr.filter((s) => s === '正财' || s === '偏财').length
    if (caiTouN + caiMainZhi >= 2) return null
  }
  return {
    note: `地支 ${selfWx}+${yinWx} ${supportZhi} 位 · ${selfWx} 透 ${ctx.ganWxCount(targetWx as WuXing)} 位${caiTouN ? `，财透${caiTouN}` : '，无官杀'}`,
  }
}

import type { Ctx } from '../../types'
import type { ShishenCat } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从X 共用判据（从弱派放宽版）：
 * - 天干不得透比劫/印；藏干比劫/印视为虚根可通融。
 * - 目标类别透干。
 * - 月令非印比。
 * - 地支本气 target 五行 ≥ 1 位。
 */
export function checkCong(ctx: Ctx, target: ShishenCat, targetWx: string): { note: string } | null {
  if (ctx.touCat('比劫')) return null
  if (ctx.touCat('印')) return null
  if (!ctx.touCat(target)) return null
  if (ctx.monthCat === '比劫' || ctx.monthCat === '印') return null
  const zhiSupport = ctx.zhiMainWxCount(targetWx as WuXing)
  if (zhiSupport < 1) return null
  const monthIs = ctx.monthCat === target
  return {
    note: `天干无印比透${monthIs ? `，月令${target}` : ''}，地支 ${targetWx} ${zhiSupport} 位`,
  }
}
