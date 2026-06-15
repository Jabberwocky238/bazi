import { SHI_SHEN_CAT, type Ctx } from '../../types'
import type { GejuHit } from '../../types'
import type { Shishen } from '@jabberwocky238/bazi-engine'

/** 财多身弱：身弱 + 财透干 ≥ 2 或 财在地支主气 ≥ 2。 */
export function isCaiDuoShenRuo(ctx: Ctx): GejuHit | null {
  if (!ctx.shenRuo) return null
  const caiTou = (['正财', '偏财'] as Shishen[]).map((s) => ctx.tou(s) ? 1 : 0 as number)
  const touN = (caiTou[0] + caiTou[1])
  const zhiN = ctx.mainArr.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '财').length
  if (touN < 2 && zhiN < 2) return null
  return { name: '财多身弱', note: `财透 ${touN} 位，地支主气 ${zhiN} 位` }
}
