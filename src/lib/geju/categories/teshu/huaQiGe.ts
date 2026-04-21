import type { Ctx } from '../../ctx'
import type { GejuHit } from '../../types'
import { ganWuxing, type WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 化气格 —— md：「日干与月干或日干与时干形成五合」
 *          「化神在月令当令或局中极旺」
 *          「化干(日主之原本五行)无根」。
 */
const HE_MAP: Record<string, { partner: string; huaWx: string }> = {
  甲: { partner: '己', huaWx: '土' }, 己: { partner: '甲', huaWx: '土' },
  乙: { partner: '庚', huaWx: '金' }, 庚: { partner: '乙', huaWx: '金' },
  丙: { partner: '辛', huaWx: '水' }, 辛: { partner: '丙', huaWx: '水' },
  丁: { partner: '壬', huaWx: '木' }, 壬: { partner: '丁', huaWx: '木' },
  戊: { partner: '癸', huaWx: '火' }, 癸: { partner: '戊', huaWx: '火' },
}

export function isHuaQiGe(ctx: Ctx): GejuHit | null {
  const info = HE_MAP[ctx.dayGan]
  if (!info) return null
  const monthGan = ctx.pillars.month.gan
  const hourGan = ctx.pillars.hour.gan
  if (monthGan !== info.partner && hourGan !== info.partner) return null
  if (ctx.rootWx(ctx.dayWx)) return null
  const monthWx = ganWuxing((ctx.pillars.month.hideGans[0] ?? '') as never)
  const huaStrong = monthWx === info.huaWx || ctx.zhiMainWxCount(info.huaWx as WuXing) >= 2
  if (!huaStrong) return null
  const sameN = ctx.mainArr.filter((p) => p.gan === ctx.dayGan).length
  if (sameN > 1) return null
  return { name: '化气格', note: `${ctx.dayGan}${info.partner} 合化${info.huaWx} · 化干无根 · 化神旺` }
}
