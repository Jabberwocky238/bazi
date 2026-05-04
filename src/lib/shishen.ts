/**
 * 八字 store 链：
 *   useBazi    — 持有 BaziResult + 派生柱级数据/查询；接管原 Ctx 大部分柱面字段。
 *   useShishen — 十神面派生数据 + 查询方法（tou / countCat / adjacentTou ...）。
 *   useShensha — 神煞按柱视图。
 *
 * 计算函数 (computeBazi / baziToPillars / shishenWuxing / EMPTY_PILLAR / Bazi /
 * HOUR_UNKNOWN) 已搬到 `./shared` 与 `./compute`。合冲刑害 extras 引化分析在 `./ganzhi`。
 */
import { create } from 'zustand'
import {
  ganWuxing,
  seasonOf,
  type Gan,
  type Zhi,
  type Season,
  type Shishen,
  type ShishenCat,
  type WuXing,
} from '@jabberwocky238/bazi-engine'
import type { Pillar, BaziResult } from './store'
import { CHONG_PAIR, SHI_SHEN_CAT, YANG_GANS } from './shared'

// ————————————————————————————————————————————————————————
// useBazi —— 持有 BaziResult + 柱面派生 + 五行查询
// ————————————————————————————————————————————————————————

const EMPTY_BAZI: BaziResult = {
  solarStr: '',
  trueSolarStr: '',
  lunarStr: '',
  pillars: [],
  hourKnown: false,
}

interface BaziDerived {
  /** 日主天干。pillars 不齐时回空串。 */
  dayGan: Gan | ''
  dayZhi: Zhi | ''
  dayGz: string
  dayWx: WuXing | ''
  /** 日主阳干（甲丙戊庚壬）。 */
  dayYang: boolean
  yearZhi: Zhi | ''
  monthZhi: Zhi | ''
  /** 月支所在季节，pillars 不齐时回空串。 */
  season: Season | ''
  /** 月支主气十神类别（'比劫' / '财' …）。 */
  monthCat: ShishenCat | ''
  /** 月支是否被其他柱地支所冲。 */
  monthZhiBeingChong: boolean
  /** 四柱数组别名（同 pillars，便于沿用旧 ctx.mainArr 的语义）。 */
  mainArr: Pillar[]
  /** 年/月/时三柱天干集合（不含日主）。 */
  ganSet: Set<Gan>
}

interface BaziStore extends BaziResult, BaziDerived {
  setBazi: (r: BaziResult) => void
  ganWxCount: (wx: WuXing) => number
  zhiMainWxCount: (wx: WuXing) => number
  touWx: (wx: WuXing) => boolean
  rootWx: (wx: WuXing) => boolean
  /** 本气或中气含此五行。 */
  rootExt: (wx: WuXing) => boolean
}

function deriveBazi(b: BaziResult): BaziDerived {
  const [year, month, day, hour] = b.pillars
  const dayGan = (day?.gan ?? '') as Gan | ''
  const dayZhi = (day?.zhi ?? '') as Zhi | ''
  const monthZhi = (month?.zhi ?? '') as Zhi | ''
  const monthMain = month?.hideShishen[0]
  let season: Season | '' = ''
  if (monthZhi) {
    try { season = seasonOf(monthZhi as Zhi) } catch { season = '' }
  }
  const monthChongTarget = CHONG_PAIR[monthZhi]
  const monthZhiBeingChong = !!monthChongTarget && [
    year?.zhi, day?.zhi, hour?.zhi,
  ].includes(monthChongTarget as Zhi)
  return {
    dayGan,
    dayZhi,
    dayGz: dayGan && dayZhi ? `${dayGan}${dayZhi}` : '',
    dayWx: (dayGan ? ganWuxing(dayGan as Gan) : '') as WuXing | '',
    dayYang: !!dayGan && YANG_GANS.has(dayGan),
    yearZhi: (year?.zhi ?? '') as Zhi | '',
    monthZhi,
    season,
    monthCat: (monthMain ? (SHI_SHEN_CAT[monthMain] ?? '') : '') as ShishenCat | '',
    monthZhiBeingChong,
    mainArr: b.pillars,
    ganSet: new Set(
      [year?.gan, month?.gan, hour?.gan].filter(Boolean) as Gan[],
    ),
  }
}

export const useBazi = create<BaziStore>()((set, get) => ({
  ...EMPTY_BAZI,
  ...deriveBazi(EMPTY_BAZI),
  setBazi: (r) => set({ ...r, ...deriveBazi(r) }),
  ganWxCount: (wx) => get().pillars.filter((p) => ganWuxing(p.gan) === wx).length,
  zhiMainWxCount: (wx) =>
    get().pillars.filter((p) => {
      const g = p.hideGans[0]
      return !!g && ganWuxing(g) === wx
    }).length,
  touWx: (wx) => get().pillars.some((p, i) => i !== 2 && ganWuxing(p.gan) === wx),
  rootWx: (wx) => get().zhiMainWxCount(wx) > 0,
  rootExt: (wx) =>
    get().pillars.some((p) => {
      const b = p.hideGans[0]
      const m = p.hideGans[1]
      return (!!b && ganWuxing(b) === wx) || (!!m && ganWuxing(m) === wx)
    }),
}))

// ————————————————————————————————————————————————————————
// useShishen —— 十神面派生 + 查询方法
// ————————————————————————————————————————————————————————

interface ShishenDerived {
  dayGan: Gan | ''
  byPillar: Shishen[]
  hideByPillar: Shishen[][]
  /** 年/月/时 三柱天干十神（剔除"日主"）。 */
  ganSs: Shishen[]
  /** 四柱地支本气十神（按柱索引对齐；未知位回 ''）。 */
  mainZhiArr: string[]
  /** 四柱所有藏干十神展平。 */
  allZhiArr: Shishen[]
}

interface ShishenStore extends ShishenDerived {
  tou: (s: Shishen) => boolean
  touCat: (c: ShishenCat) => boolean
  zang: (s: Shishen) => boolean
  has: (s: Shishen) => boolean
  hasCat: (c: ShishenCat) => boolean
  mainAt: (s: Shishen) => number[]
  strong: (s: Shishen) => boolean
  strongCat: (c: ShishenCat) => boolean
  countOf: (s: Shishen) => number
  countCat: (c: ShishenCat) => number
  /** 两个十神是否在相邻柱天干紧贴（差 1）。 */
  adjacentTou: (s1: Shishen, s2: Shishen) => boolean
}

function deriveShishen(b: BaziResult): ShishenDerived {
  const [year, month, day, hour] = b.pillars
  const ganSs: Shishen[] = []
  for (const p of [year, month, hour]) {
    if (!p) continue
    const s = p.shishen
    if (s && (s as string) !== '日主') ganSs.push(s)
  }
  return {
    dayGan: (day?.gan ?? '') as Gan | '',
    byPillar: b.pillars.map((p) => p.shishen),
    hideByPillar: b.pillars.map((p) => p.hideShishen),
    ganSs,
    mainZhiArr: b.pillars.map((p) => (p.hideShishen[0] ?? '') as string),
    allZhiArr: b.pillars.flatMap((p) => p.hideShishen),
  }
}

export const useShishen = create<ShishenStore>()((set, get) => ({
  ...deriveShishen(useBazi.getState()),
  tou: (s) => get().ganSs.includes(s),
  touCat: (c) => get().ganSs.some((s) => SHI_SHEN_CAT[s] === c),
  zang: (s) => get().allZhiArr.includes(s),
  has: (s) => get().tou(s) || get().zang(s),
  hasCat: (c) => get().touCat(c) || get().allZhiArr.some((s) => SHI_SHEN_CAT[s] === c),
  mainAt: (s) => {
    const out: number[] = []
    get().mainZhiArr.forEach((x, i) => { if (x === s) out.push(i) })
    return out
  },
  strong: (s) => get().tou(s) || get().mainAt(s).length > 0,
  strongCat: (c) => {
    const main = useBazi.getState().mainArr
    return main.some((p, i) => {
      if (i !== 2 && SHI_SHEN_CAT[p.shishen as string] === c) return true
      const h = p.hideShishen[0]
      return !!h && SHI_SHEN_CAT[h] === c
    })
  },
  countOf: (s) => {
    const { ganSs, allZhiArr } = get()
    let n = 0
    for (const g of ganSs) if (g === s) n++
    for (const z of allZhiArr) if (z === s) n++
    return n
  },
  countCat: (c) => {
    const { ganSs, allZhiArr } = get()
    let n = 0
    for (const g of ganSs) if (SHI_SHEN_CAT[g] === c) n++
    for (const z of allZhiArr) if (SHI_SHEN_CAT[z] === c) n++
    return n
  },
  adjacentTou: (s1, s2) => {
    const main = useBazi.getState().mainArr
    const posOf = (s: Shishen) => {
      const out: number[] = []
      if (main[0]?.shishen === s) out.push(0)
      if (main[1]?.shishen === s) out.push(1)
      if (main[3]?.shishen === s) out.push(3)
      return out
    }
    const p1 = posOf(s1)
    const p2 = posOf(s2)
    for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
    return false
  },
}))

useBazi.subscribe((s, prev) => {
  if (s.pillars === prev.pillars) return
  useShishen.setState(deriveShishen(s))
})

// ————————————————————————————————————————————————————————
// useShensha —— 神煞按柱视图
// ————————————————————————————————————————————————————————

interface ShenshaStore {
  byPillar: string[][]
}

function deriveShensha(b: BaziResult): ShenshaStore {
  return { byPillar: b.pillars.map((p) => p.shensha) }
}

export const useShensha = create<ShenshaStore>()(() => deriveShensha(useBazi.getState()))

useBazi.subscribe((s, prev) => {
  if (s.pillars === prev.pillars) return
  useShensha.setState(deriveShensha(s))
})
