import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'

/** 食伤混杂（病格）：食神与伤官同时透干。 */
export function isShiShangHunZa(ctx: Ctx): GejuHit | null {
  if (!(ctx.tou('食神') && ctx.tou('伤官'))) return null
  return { name: '食伤混杂', note: '食神伤官双透' }
}
