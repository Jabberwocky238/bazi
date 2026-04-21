import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { checkZhuanWang } from './_check'

/**
 * 润下格：壬癸水日主专旺。
 *
 * 变体 (guigeVariant, 依 md)：
 *  - 润下清华：润下 + 木泄秀 (水木清华) 或 金生水源 (金白水清) —— 智慧外显，最佳形态。
 *  - 无变体：纯水润下，偏幽深内敛。
 */
export function isRunXiaGe(ctx: Ctx): GejuHit | null {
  const r = checkZhuanWang(ctx, '水')
  if (!r) return null
  const muN = ctx.ganWxCount('木') + ctx.zhiMainWxCount('木')
  const jinN = ctx.ganWxCount('金') + ctx.zhiMainWxCount('金')
  const hasExtra = muN > 0 || jinN > 0
  const tags: string[] = []
  if (muN > 0) tags.push(`木泄秀 ${muN} 位`)
  if (jinN > 0) tags.push(`金生水 ${jinN} 位`)
  return {
    name: '润下格',
    note: `${r.note}${hasExtra ? ` · ${tags.join(' / ')}` : ''}`,
    ...(hasExtra ? { guigeVariant: '润下清华' } : {}),
  }
}
