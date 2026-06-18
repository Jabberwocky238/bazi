import type { SkillCategory } from './skills'
import {
  ShishenMap,
  ganWuxing,
  wuxingRelations,
  seasonOf,
  type Gan,
  type Zhi,
  type WuXing,
  type Shishen,
  type ShishenCat,
  type Season,
} from '@jabberwocky238/bazi-engine'

export type PillarType = '年柱' | '月柱' | '日柱' | '时柱' | '大运' | '流年' | '流月' | '流日' | '流时'

export interface DetailedPillar {
  label: PillarType

  gan: Gan
  zhi: Zhi
  shishen: Shishen // 十神
  hideGans: Gan[] // 藏干
  hideShishen: Shishen[] // 藏干十神

  nayin: string

  ganWuxing: WuXing
  zhiWuxing: WuXing
  shishenWuxing: WuXing // 十神五行
  hideShishenWuxings: WuXing[] // 藏干十神五行

  shensha: string[]
  zizuo: string
}

export type BaziResult = {
  solarStr: string
  trueSolarStr: string
  lunarStr: string
  pillars: DetailedPillar[]
  hourKnown: boolean
}

export interface SkillFocus {
  category: SkillCategory
  name: string
  subtitle?: string
}
/**
 * 跨文件共享的基础常量与小工具。
 * 不包含 store / 计算逻辑，仅常量与纯函数。
 */
/** 时辰未知占位 (BaziInputState.hour 取这个值即代表"时柱未知")。 */
export const HOUR_UNKNOWN = -1
/** 四柱干支字符串元组 (年/月/日/时)，如 `['甲子','己巳','壬子','乙巳']`。 */
export type Bazi = [string, string, string, string]
/** 十神 → 类别映射（依 engine ShishenMap 派生）。 */
export const SHI_SHEN_CAT: Record<string, ShishenCat> = Object.fromEntries(
  Object.entries(ShishenMap).map(([name, def]) => [name, def.category]),
) as Record<string, ShishenCat>
/** 地支六冲对。 */
export const CHONG_PAIR: Record<string, string> = {
  子: '午', 午: '子', 卯: '酉', 酉: '卯',
 寅: '申', 申: '寅', 巳: '亥', 亥: '巳',
 辰: '戌', 戌: '辰', 丑: '未', 未: '丑',
}
/** 阳干集合 (甲/丙/戊/庚/壬)。 */
export const YANG_GANS: ReadonlySet<string> = new Set(['甲', '丙', '戊', '庚', '壬'])
/**
 * 十神五行 (依日主) — 通过 engine 的 ShishenMap + wuxingRelations 派生。
 * 日主本位/空串/未识别十神统一回空串。
 */
export function shishenWuxing(dayGan: string, shishen: string): WuXing | '' {
  if (shishen === '日主') return ganWuxing(dayGan as Gan) ?? ''
  const def = ShishenMap[shishen as Shishen]
  if (!def) return ''
  return wuxingRelations(dayGan as Gan)[def.relation] ?? ''
}
/** 时辰未知时的占位时柱 (UI 应依 hourKnown 跳过渲染)。 */
export const EMPTY_PILLAR: DetailedPillar = {
  label: '时柱',
  gan: '',
  zhi: '',
  ganWuxing: '',
  zhiWuxing: '',
  nayin: '',
  hideGans: [],
  shishen: '',
  shishenWuxing: '',
  hideShishen: [],
  hideShishenWuxings: [],
  shensha: [],
  zizuo: '',
} as unknown as DetailedPillar

/** 空排盘结果占位 */
export const EMPTY_RESULT: BaziResult = {
  solarStr: '',
  trueSolarStr: '',
  lunarStr: '',
  pillars: [],
  hourKnown: false,
}
/**
 * 八字基础派生计算：
 *   deriveBazi    — BaziResult → 柱面派生数据（日主/季节/月令等）
 *   deriveShishen — BaziResult → 十神面派生数据
 *   deriveShensha — BaziResult → 神煞按柱视图
 *
 * 所有查询方法改为纯函数，第一个参数为 pillars 或派生数据。
 */
// ————————————————————————————————————————————————————————
// deriveBazi — 柱面派生 + 五行查询方法
// ————————————————————————————————————————————————————————
export interface BaziDerived {
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
  mainArr: DetailedPillar[]
  /** 年/月/时三柱天干集合（不含日主）。 */
  ganSet: Set<Gan>
}
export function deriveBazi(b: BaziResult): BaziDerived {
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
/** 天干五行计数。 */
export function ganWxCount(pillars: DetailedPillar[], wx: WuXing): number {
  return pillars.filter((p) => ganWuxing(p.gan) === wx).length
}
/** 地支本气五行计数。 */
export function zhiMainWxCount(pillars: DetailedPillar[], wx: WuXing): number {
  return pillars.filter((p) => {
    const g = p.hideGans[0]
    return !!g && ganWuxing(g) === wx
  }).length
}
/** 年/月/时三柱天干是否透此五行。 */
export function touWx(pillars: DetailedPillar[], wx: WuXing): boolean {
  return pillars.some((p, i) => i !== 2 && ganWuxing(p.gan) === wx)
}
/** 地支本气是否有根。 */
export function rootWx(pillars: DetailedPillar[], wx: WuXing): boolean {
  return zhiMainWxCount(pillars, wx) > 0
}
/** 本气或中气含此五行。 */
export function rootExt(pillars: DetailedPillar[], wx: WuXing): boolean {
  return pillars.some((p) => {
    const b = p.hideGans[0]
    const m = p.hideGans[1]
    return (!!b && ganWuxing(b) === wx) || (!!m && ganWuxing(m) === wx)
  })
}
// ————————————————————————————————————————————————————————
// deriveShishen — 十神面派生 + 查询方法
// ————————————————————————————————————————————————————————
export interface ShishenDerived {
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
export function deriveShishen(b: BaziResult): ShishenDerived {
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
/** 天干是否透某十神。 */
export function tou(s: ShishenDerived, ss: Shishen): boolean {
  return s.ganSs.includes(ss)
}
/** 天干是否透某类别十神。 */
export function touCat(s: ShishenDerived, c: ShishenCat): boolean {
  return s.ganSs.some((ss) => SHI_SHEN_CAT[ss] === c)
}
/** 地支藏干是否含某十神。 */
export function zang(s: ShishenDerived, ss: Shishen): boolean {
  return s.allZhiArr.includes(ss)
}
/** 透或藏是否含某十神。 */
export function has(s: ShishenDerived, ss: Shishen): boolean {
  return tou(s, ss) || zang(s, ss)
}
/** 透或藏是否含某类别十神。 */
export function hasCat(s: ShishenDerived, c: ShishenCat): boolean {
  return touCat(s, c) || s.allZhiArr.some((ss) => SHI_SHEN_CAT[ss] === c)
}
/** 某十神在地支本气出现的柱索引列表。 */
export function mainAt(s: ShishenDerived, ss: Shishen): number[] {
  const out: number[] = []
  s.mainZhiArr.forEach((x, i) => { if (x === ss) out.push(i) })
  return out
}
/** 透或在地支本气出现，即"有力"。 */
export function strong(s: ShishenDerived, ss: Shishen): boolean {
  return tou(s, ss) || mainAt(s, ss).length > 0
}
/** 某类别十神是否透或在地支本气出现。 */
export function strongCat(pillars: DetailedPillar[], c: ShishenCat): boolean {
  return pillars.some((p, i) => {
    if (i !== 2 && SHI_SHEN_CAT[p.shishen as string] === c) return true
    const h = p.hideShishen[0]
    return !!h && SHI_SHEN_CAT[h] === c
  })
}
/** 某十神出现次数（透 + 藏）。 */
export function countOf(s: ShishenDerived, ss: Shishen): number {
  const { ganSs, allZhiArr } = s
  let n = 0
  for (const g of ganSs) if (g === ss) n++
  for (const z of allZhiArr) if (z === ss) n++
  return n
}
/** 某类别十神出现次数（透 + 藏）。 */
export function countCat(s: ShishenDerived, c: ShishenCat): number {
  const { ganSs, allZhiArr } = s
  let n = 0
  for (const g of ganSs) if (SHI_SHEN_CAT[g] === c) n++
  for (const z of allZhiArr) if (SHI_SHEN_CAT[z] === c) n++
  return n
}
/** 两个十神是否在相邻柱天干紧贴（差 1）。 */
export function adjacentTou(pillars: DetailedPillar[], s1: Shishen, s2: Shishen): boolean {
  const posOf = (s: Shishen) => {
    const out: number[] = []
    if (pillars[0]?.shishen === s) out.push(0)
    if (pillars[1]?.shishen === s) out.push(1)
    if (pillars[3]?.shishen === s) out.push(3)
    return out
  }
  const p1 = posOf(s1)
  const p2 = posOf(s2)
  for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
  return false
}
// ————————————————————————————————————————————————————————
// deriveShensha — 神煞按柱视图
// ————————————————————————————————————————————————————————
export interface ShenshaDerived {
  byPillar: string[][]
}
export function deriveShensha(b: BaziResult): ShenshaDerived {
  return { byPillar: b.pillars.map((p) => p.shensha) }
}
