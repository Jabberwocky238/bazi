import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 枭神夺食（病格，md 无规范成立条件）：
 *  偏印透 + 食神存在 + 无财救。
 *  月令伤官 + 伤官透干 → 结构为伤官格，让位。
 */
export function isXiaoShenDuoShi(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('偏印')) return null
  if (!ctx.has('食神')) return null
  if (ctx.touCat('财')) return null
  if (ctx.mainAt('伤官').includes(1) && ctx.tou('伤官')) return null
  return { name: '枭神夺食', note: '偏印透克食神，无财救' }
}
