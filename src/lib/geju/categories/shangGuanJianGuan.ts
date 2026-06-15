import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'
import type { Shishen } from '@jabberwocky238/bazi-engine'

/**
 * 伤官见官（病格，依 md 4 条，按 "至少一方透干 + 柱位相邻" 放宽）：
 *  1. 伤官与正官同时存在（可透可藏），至少一方透干。
 *  2. 两者所在柱位相邻或同柱。
 *  3. 无印透救、无财透泄。
 */
export function isShangGuanJianGuan(ctx: Ctx): GejuHit | null {
  const shangPos = posOfShishen(ctx, '伤官')
  const guanPos = posOfShishen(ctx, '正官')
  if (shangPos.length === 0 || guanPos.length === 0) return null
  if (!ctx.tou('伤官') && !ctx.tou('正官')) return null
  const close = shangPos.some((a) => guanPos.some((b) => Math.abs(a - b) <= 1))
  if (!close) return null
  if (ctx.touCat('印')) return null
  if (ctx.touCat('财')) return null
  return { name: '伤官见官', note: '伤官正官同现 · 柱位相邻 · 无印财救' }
}

function posOfShishen(ctx: Ctx, name: Shishen): number[] {
  const positions = new Set<number>()
  ctx.mainArr.forEach((p, i) => {
    if (p.shishen === name) positions.add(i)
    if (p.hideShishen.includes(name)) positions.add(i)
  })
  return Array.from(positions)
}
