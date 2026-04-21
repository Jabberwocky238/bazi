import { WX_GENERATED_BY, type Ctx } from '../ctx'
import type { GejuHit } from '../types'

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
  const yinWx = WX_GENERATED_BY[selfWx]
  const supportZhi = ctx.zhiMainWxCount(selfWx) + ctx.zhiMainWxCount(yinWx)
  if (supportZhi < 3) return null
  if (ctx.touCat('官杀')) return null
  if (ctx.ganWxCount(targetWx) < 2) return null
  // md 条件 5: 食伤重泄破
  if (ctx.countCat('食伤') >= 3) return null
  const caiTouN =
    (ctx.tou('正财') ? 1 : 0) + (ctx.tou('偏财') ? 1 : 0)
  if (caiTouN > maxCaiTou) return null
  if (maxCaiTou <= 1 && ctx.countCat('财') >= 2) return null     // 稼穑: 水多冲土
  return {
    note: `地支 ${selfWx}+${yinWx} ${supportZhi} 位 · ${selfWx} 透 ${ctx.ganWxCount(targetWx)} 位${caiTouN ? `，财透${caiTouN}` : '，无官杀'}`,
  }
}

/** 曲直格：甲乙木日主专旺。 */
export function isQuZhiGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '木')
  return r ? { name: '曲直格', note: r.note } : null
}
/** 炎上格：丙丁火日主专旺。 */
export function isYanShangGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '火')
  return r ? { name: '炎上格', note: r.note } : null
}
/** 稼穑格：戊己土日主专旺 + 月令辰戌丑未 + 财透 ≤ 1 (水不多冲土)。 */
export function isJiaSeGe(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(ctx.monthZhi)) return null
  const r = checkZhuanWang(ctx, '土', 1)
  return r ? { name: '稼穑格', note: `月令 ${ctx.monthZhi} ; ${r.note}` } : null
}
/** 从革格：庚辛金日主专旺。 */
export function isCongGeGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '金')
  return r ? { name: '从革格', note: r.note } : null
}
/** 润下格：壬癸水日主专旺。 */
export function isRunXiaGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '水')
  return r ? { name: '润下格', note: r.note } : null
}
