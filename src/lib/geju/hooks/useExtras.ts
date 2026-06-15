/**
 * 格局判定用 — 岁运快照 + 写入 store.
 * GejuPanel 选中大运/流年时 setExtras; detector 通过 readExtras() 读取.
 */
import { create } from 'zustand'
import { ganWuxing, zhiWuxing, type Pillar as EnginePillar, type Shishen, type ShishenCat, type WuXing } from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../../store'
import { SHI_SHEN_CAT } from '../../shared'
import type { DaYunMeta } from '../types'

interface GejuExtrasStore {
  dayun: Pillar | null
  liunian: Pillar | null
  daYunMeta: DaYunMeta | null
  setExtras: (e: { dayun?: Pillar | null; liunian?: Pillar | null; daYunMeta?: DaYunMeta | null }) => void
  clearExtras: () => void
}

export const useGejuExtras = create<GejuExtrasStore>((set) => ({
  dayun: null,
  liunian: null,
  daYunMeta: null,
  setExtras: (e) => set({
    dayun: e.dayun ?? null,
    liunian: e.liunian ?? null,
    daYunMeta: e.daYunMeta ?? null,
  }),
  clearExtras: () => set({ dayun: null, liunian: null, daYunMeta: null }),
}))

export interface ExtrasSnapshot {
  extraArr: Pillar[]
  extraPillars: Pillar[]
  daYunMeta: DaYunMeta | null
  /** 是否非空 (有大运 / 流年). */
  active: boolean
  extraGanWxCount: (wx: WuXing) => number
  extraZhiMainWxCount: (wx: WuXing) => number
  /** 岁运柱天干十神 是否含 s. */
  tou: (s: Shishen) => boolean
  /** 岁运柱天干十神 是否含 类别 c. */
  touCat: (c: ShishenCat) => boolean
  /** 岁运柱地支藏干十神 是否含 s. */
  zang: (s: Shishen) => boolean
  /** 岁运柱 (透或藏) 是否含 s. */
  has: (s: Shishen) => boolean
  /** 岁运柱 (透或藏) 是否含类别 c. */
  hasCat: (c: ShishenCat) => boolean
}

export function readExtras(): ExtrasSnapshot {
  const s = useGejuExtras.getState()
  const arr: Pillar[] = []
  if (s.dayun) arr.push(s.dayun)
  if (s.liunian) arr.push(s.liunian)
  const ganShishens = arr.map((p) => p.shishen as Shishen).filter(Boolean)
  const allShishens = arr.flatMap((p) => [p.shishen as Shishen, ...(p.hideShishen ?? [])]).filter(Boolean)
  return {
    extraArr: arr,
    extraPillars: arr,
    daYunMeta: s.daYunMeta,
    active: arr.length > 0,
    extraGanWxCount: (wx) =>
      arr.filter((p) => ganWuxing(p.gan as EnginePillar['gan']) === wx).length,
    extraZhiMainWxCount: (wx) =>
      arr.filter((p) => zhiWuxing(p.zhi as EnginePillar['zhi']) === wx).length,
    tou: (ss) => ganShishens.includes(ss),
    touCat: (c) => ganShishens.some((ss) => SHI_SHEN_CAT[ss] === c),
    zang: (ss) => arr.some((p) => p.hideShishen?.includes(ss)),
    has: (ss) => allShishens.includes(ss),
    hasCat: (c) => allShishens.some((ss) => SHI_SHEN_CAT[ss] === c),
  }
}
