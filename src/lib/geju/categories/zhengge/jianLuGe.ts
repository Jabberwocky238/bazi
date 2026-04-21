import { LU, type Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 建禄格（依 md 四条）：
 *  1. 月支本气为日主之禄。
 *  2. 月令不被冲。
 *  3. 官/财/食伤之一透干且通根作为泄/克出口。
 *  4. 身不过旺。
 */
export function isJianLuGe(ctx: Ctx): GejuHit | null {
  if (ctx.monthZhi !== LU[ctx.dayGan]) return null
  if (ctx.monthZhiBeingChong) return null
  const officerRooted = ctx.touCat('官杀') && (ctx.zang('正官') || ctx.zang('七杀'))
  const caiRooted = ctx.touCat('财') && (ctx.zang('正财') || ctx.zang('偏财'))
  const shiShangRooted = ctx.touCat('食伤') && (ctx.zang('食神') || ctx.zang('伤官'))
  if (!officerRooted && !caiRooted && !shiShangRooted) return null
  if (ctx.countCat('比劫') + ctx.countCat('印') >= 6) return null
  return {
    name: '建禄格',
    note: `月令 ${ctx.monthZhi} 临日主 ${ctx.dayGan} 之禄，带官/财/食伤透根为用`,
  }
}
