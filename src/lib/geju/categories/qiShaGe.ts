import { YANG_REN, type Ctx } from '../../types'
import type { Gan } from '@jabberwocky238/bazi-engine'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/** 天干五合：甲己/乙庚/丙辛/丁壬/戊癸。 */
const HE_GAN: Record<Gan, Gan> = {
  甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸',
  己: '甲', 庚: '乙', 辛: '丙', 壬: '丁', 癸: '戊',
}

/** 日主正官天干。 */
const ZHENG_GUAN: Record<Gan, Gan> = {
  甲: '辛', 乙: '庚', 丙: '癸', 丁: '壬', 戊: '乙',
  己: '甲', 庚: '丁', 辛: '丙', 壬: '己', 癸: '戊',
}

/** 正官透干且被日干合去 (阴日: 乙庚/丁壬/己甲/辛丙/癸戊)。 */
function zhengGuanHeQu(ctx: Ctx): boolean {
  const heTarget = HE_GAN[ctx.dayGan]
  const guanGan = ZHENG_GUAN[ctx.dayGan]
  if (heTarget !== guanGan) return false
  return ctx.pillars.month.gan === guanGan || ctx.pillars.hour.gan === guanGan
}

/**
 * 七杀格（依《子平真诠·论七杀》+ "合官留杀"）：
 *  1. 月令本气为七杀。
 *  2. 正官透且未被日干合去 → 官杀混杂破格。
 *  3. 日主非极弱/近从弱。
 *  (食神制 / 印化 / 阳刃敌 视为加分 note，非必要条件。)
 */
export function isQiShaGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '七杀')) return null
  const heQu = zhengGuanHeQu(ctx)
  if (ctx.tou('正官') && !heQu) return null
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  const foodControl = ctx.tou('食神') && ctx.zang('食神') && ctx.adjacentTou('食神', '七杀')
  const yinHua = ctx.touCat('印') && (ctx.zang('正印') || ctx.zang('偏印'))
  const renDiSha = ctx.dayYang && ctx.mainArr.some(
    (p, i) => i !== 2 && p.zhi === (YANG_REN[ctx.dayGan] ?? ''),
  )
  const details: string[] = []
  if (heQu) details.push('合官留杀')
  if (foodControl) details.push('食神制')
  if (yinHua) details.push('印化')
  if (renDiSha) details.push('阳刃敌')
  return {
    name: '七杀格',
    note: `月令七杀${details.length ? ' · ' + details.join(' / ') : ' · 无明显制化'}`,
  }
}
