import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 金寒水冷：冬月 + (日主金或水) + 金水齐透 + 无火透。 */
export function isJinHanShuiLeng(ctx: Ctx): GejuHit | null {
  if (ctx.season !== '冬') return null
  if (ctx.dayWx !== '金' && ctx.dayWx !== '水') return null
  if (!ctx.touWx('金') || !ctx.touWx('水')) return null
  if (ctx.touWx('火')) return null
  return { name: '金寒水冷', note: '冬月金水并透，火缺调候' }
}

/**
 * 金白水清（严格依《穷通宝鉴》）：
 *  1. 庚/辛日主；
 *  2. 秋或冬；
 *  3. 水透 + 通根；
 *  4. 金有根；
 *  5. 无戊己土透；
 *  6. 无丙丁火透。
 */
export function isJinBaiShuiQing(ctx: Ctx): GejuHit | null {
  if (ctx.dayWx !== '金') return null
  if (ctx.season !== '秋' && ctx.season !== '冬') return null
  if (!(ctx.touWx('水') && ctx.rootWx('水'))) return null
  if (!ctx.rootWx('金')) return null
  if (ctx.touWx('土')) return null
  if (ctx.touWx('火')) return null
  const monthIsShenYou = ctx.monthZhi === '申' || ctx.monthZhi === '酉'
  return {
    name: '金白水清',
    note: `${ctx.season}月金水并秀${monthIsShenYou ? '，月令秋金当令' : ''}`,
  }
}
