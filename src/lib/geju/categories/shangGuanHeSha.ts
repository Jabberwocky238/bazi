import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 伤官合杀（依 md 5 条）：
 *  1. 阴日主（乙/丁/己/辛/癸）。
 *  2. 伤官与七杀均透干。
 *  3. 位置紧贴。
 *  4. 无争合（伤官或七杀在干上 ≤ 1 位）。
 *  5. 化神（若化）非忌 —— ctx 无法判定喜忌，略。
 */
export function isShangGuanHeSha(ctx: Ctx): GejuHit | null {
  if (ctx.dayYang) return null
  if (!ctx.tou('伤官') || !ctx.tou('七杀')) return null
  if (!ctx.adjacentTou('伤官', '七杀')) return null
  const shangN = ctx.mainArr.filter((p, i) => i !== 2 && p.shishen === '伤官').length
  const shaN = ctx.mainArr.filter((p, i) => i !== 2 && p.shishen === '七杀').length
  if (shangN > 1 || shaN > 1) return null
  return { name: '伤官合杀', note: `阴日主 ${ctx.dayGan} 伤官七杀紧贴双透五合，无争合` }
}
