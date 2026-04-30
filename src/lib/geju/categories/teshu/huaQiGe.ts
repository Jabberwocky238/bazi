import { readBazi } from '../../hooks'
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

export function isHuaQiGe(): GejuHit | null {
  const bazi = readBazi()
  const info = HE_MAP[bazi.dayGan]
  if (!info) return null
  const monthGan = bazi.pillars.month.gan
  const hourGan = bazi.pillars.hour.gan
  if (monthGan !== info.partner && hourGan !== info.partner) return null
  if (bazi.rootWx(bazi.dayWx)) return null
  const monthWx = ganWuxing((bazi.pillars.month.hideGans[0] ?? '') as never)
  const huaStrong = monthWx === info.huaWx || bazi.zhiMainWxCount(info.huaWx as WuXing) >= 2
  if (!huaStrong) return null
  const sameN = bazi.mainArr.filter((p) => p.gan === bazi.dayGan).length
  if (sameN > 1) return null
  return { name: '化气格', note: `${bazi.dayGan}${info.partner} 合化${info.huaWx} · 化干无根 · 化神旺` }
}
