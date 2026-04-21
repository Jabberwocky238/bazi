import { WX_GENERATED_BY, type Ctx } from '../../ctx'
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
  const supportZhi = ctx.zhiMainWxCount(selfWx) + ctx.zhiMainWxCount(yinWx)
  if (supportZhi < 3) return null
  if (ctx.touCat('官杀')) return null
  if (ctx.ganWxCount(targetWx as WuXing) < 2) return null
  // md 条件 5: 食伤重泄破
  if (ctx.countCat('食伤') >= 3) return null
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
