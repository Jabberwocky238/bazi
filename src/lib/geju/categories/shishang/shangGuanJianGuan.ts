import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/**
 * 伤官见官（病格，依 md 4 条）：
 *  1. 伤官与正官同时存在，至少一方透干（两方均透最典）。
 *  2. 两者力量均显（非"伤尽"）。
 *  3. 柱位相邻。
 *  4. 无救应（印/财/合皆无）。
 */
export function isShangGuanJianGuan(ctx: Ctx): GejuHit | null {
  if (!ctx.tou('伤官') || !ctx.tou('正官')) return null
  if (!ctx.adjacentTou('伤官', '正官')) return null
  if (ctx.touCat('印')) return null           // 佩印救
  if (ctx.touCat('财')) return null           // 生财救
  return { name: '伤官见官', note: '伤官正官紧贴且无印/财救' }
}
