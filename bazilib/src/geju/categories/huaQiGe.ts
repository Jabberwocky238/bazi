// @ts-nocheck — 孤立文件: 依赖 commit 8ff72ee 删除的 ../snapshot 全局读取 API,
//   未接入 geju/index.ts 的 DETECTORS 表 (无任何引用)。待改写为 GejuContext 后再启用。
import { readBazi, readExtras } from '../snapshot'
import type { GejuHit } from '../types'
import { ganWuxing, type WuXing } from '@jabberwocky238/bazi-engine'
import { emitGeju } from '../_emit'

/**
 * 化气格 — 日干与月干 / 时干五合 + 化神当令 / 极旺 + 化干无根.
 *
 *  bazi-skills 3 条:
 *   1. 日干与月干或时干形成五合     [静态]
 *   2. 化神在月令当令或局中极旺      [可被岁运补: 岁运补化神]
 *   3. 化干 (日主原五行) 无根        [岁运补日主五行 → 复根 Break]
 *
 *  【岁运】岁运透日主原五行 / 印 → 复根破化; 岁运透与日主形成争合的同方 → Break.
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
  const extras = readExtras()
  const info = HE_MAP[bazi.dayGan]
  if (!info) return null
  const monthGan = bazi.pillars.month.gan.name
  const hourGan = bazi.pillars.hour.gan.name
  if (monthGan !== info.partner && hourGan !== info.partner) return null
  if (bazi.dayWx && bazi.rootWx(bazi.dayWx as WuXing)) return null
  const monthWx = bazi.pillars.month.zhi.cangGan[0]?.wuxing ?? ''
  const huaStrong = monthWx === info.huaWx || bazi.zhiMainWxCount(info.huaWx as WuXing) >= 2
  if (!huaStrong) return null
  const sameN = bazi.mainArr.filter((p) => p.gan.name === bazi.dayGan).length
  if (sameN > 1) return null

  // 岁运透日主原五行 → 复根 Break; 岁运透同方与化干争合 → Break
  const dayWx = bazi.dayWx as WuXing
  const breakBy = extras.extraGanWxCount(dayWx) > 0 ||
    extras.extraArr.some((p) => p.gan.name === bazi.dayGan)

  return emitGeju(
    { name: '化气格', note: `${bazi.dayGan}${info.partner} 合化${info.huaWx} · 化干无根 · 化神旺` },
    { baseFormed: true, withExtrasFormed: !breakBy, hasExtras: extras.active },
  )
}
