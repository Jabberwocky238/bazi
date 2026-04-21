import {
  LU,
  YANG_REN,
  WU_XING,
  TRIAD_MAP,
  triadOf,
  type Gan,
  type Zhi,
} from '@jabberwocky238/bazi-engine'
import type { Pillar, ExtraPillar } from '../store'
import { ganWuxing, zhiWuxing } from '../wuxing'
import { analyzeStrength, type StrengthLevel } from '../strength'
import { SHI_SHEN_CAT, type ShishenCat } from './types'

export { LU, YANG_REN }

export const KUIGANG_DAY = new Set(['庚辰', '庚戌', '壬辰', '戊戌'])

export const WX_GENERATED_BY: Record<string, string> = { 火: '木', 土: '火', 金: '土', 水: '金', 木: '水' }
export const WX_CONTROLLED_BY: Record<string, string> = { 土: '木', 水: '土', 火: '水', 金: '火', 木: '金' }
export const WX_CONTROLS: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

export const SEASON_BY_ZHI: Record<string, '春' | '夏' | '秋' | '冬'> = {
  寅: '春', 卯: '春', 辰: '春',
  巳: '夏', 午: '夏', 未: '夏',
  申: '秋', 酉: '秋', 戌: '秋',
  亥: '冬', 子: '冬', 丑: '冬',
}

export const CHONG_PAIR: Record<string, string> = {
  子: '午', 午: '子', 卯: '酉', 酉: '卯',
  寅: '申', 申: '寅', 巳: '亥', 亥: '巳',
  辰: '戌', 戌: '辰', 丑: '未', 未: '丑',
}

export function yimaFrom(zhi: string): string | undefined {
  try {
    return TRIAD_MAP[triadOf(zhi as Zhi)]['驿马']
  } catch {
    return undefined
  }
}

export interface Ctx {
  pillars: Pillar[]
  dayGan: Gan
  dayZhi: Zhi
  dayGz: string
  monthZhi: Zhi
  yearZhi: Zhi
  dayWx: string
  season: '春' | '夏' | '秋' | '冬' | ''
  /** 日主阳干 (甲/丙/戊/庚/壬) */
  dayYang: boolean

  // —— 十神定性查询 ——
  tou(s: string): boolean
  touCat(c: ShishenCat): boolean
  zang(s: string): boolean
  has(s: string): boolean
  hasCat(c: ShishenCat): boolean
  mainAt(s: string): number[]
  strong(s: string): boolean
  strongCat(c: ShishenCat): boolean

  // —— 数量统计 (干位 + 所有藏干位) ——
  countOf(s: string): number
  countCat(c: ShishenCat): number

  // —— 五行定性查询 (按"柱数"计数) ——
  ganWxCount(wx: string): number
  zhiMainWxCount(wx: string): number
  touWx(wx: string): boolean
  rootWx(wx: string): boolean
  /** 本气 或 中气 含此五行 (如寅中丙、戌中丁算火根)。 */
  rootExt(wx: string): boolean

  // —— 日主强弱 (来自 strength.ts) ——
  level: StrengthLevel | ''
  deLing: boolean
  deDi: boolean
  deShi: boolean
  shenWang: boolean
  shenRuo: boolean

  // —— 位置关系 ——
  adjacentTou(s1: string, s2: string): boolean

  // —— 月令 ——
  monthCat: ShishenCat | ''
  monthZhiBeingChong: boolean

  // —— 岁运（大运/流年）附加柱 ——
  /** 当前挂入的额外柱，通常由 UI 点击大运/流年时通过 store 传入。空数组 = 纯原局判定。 */
  extraPillars: ExtraPillar[]
  /** 仅大运柱（label === '大运'）。 */
  dayunPillar?: ExtraPillar
  /** 仅流年柱（label === '流年'）。 */
  liunianPillar?: ExtraPillar
  /** 岁运柱（含大运+流年）天干五行计数。 */
  extraGanWxCount(wx: string): number
  /** 岁运柱地支五行计数（按地支本气/主气）。 */
  extraZhiMainWxCount(wx: string): number
}

export function buildCtx(pillars: Pillar[], extraPillars: ExtraPillar[] = []): Ctx {
  const [yearP, monthP, dayP, hourP] = pillars
  const dayGan = dayP.gan as Gan
  const dayWx = WU_XING[dayGan] ?? ganWuxing(dayGan)
  const season = SEASON_BY_ZHI[monthP.zhi as string] ?? ''

  const ganSs = [yearP.shishen, monthP.shishen, hourP.shishen].filter(
    (s) => s && s !== '日主',
  )
  const ganSet = new Set(ganSs)

  const mainZhi = pillars.map((p) => p.hideShishen[0] ?? '')
  const allZhi = pillars.flatMap((p) => p.hideShishen)

  const monthCat = (SHI_SHEN_CAT[mainZhi[1]] ?? '') as ShishenCat | ''

  const strength = analyzeStrength(pillars)
  const level: StrengthLevel | '' = strength?.level ?? ''
  const deLing = strength?.deLing ?? false
  const deDi = strength ? strength.roots[2].kind !== 'none' : false
  const deShi = strength ? strength.ganPoints > 0 : false
  const strongLv = new Set<StrengthLevel>(['身极旺', '身旺', '身中强', '身中(偏强)'])
  const weakLv = new Set<StrengthLevel>(['身略弱', '身弱', '身极弱', '近从弱', '身中(偏弱)'])
  const shenWang = level ? strongLv.has(level) : false
  const shenRuo = level ? weakLv.has(level) : false

  const tou = (s: string) => ganSet.has(s)
  const touCat = (c: ShishenCat) => ganSs.some((s) => SHI_SHEN_CAT[s] === c)
  const zang = (s: string) => allZhi.includes(s)
  const has = (s: string) => ganSet.has(s) || allZhi.includes(s)
  const hasCat = (c: ShishenCat) =>
    ganSs.some((s) => SHI_SHEN_CAT[s] === c) ||
    allZhi.some((s) => SHI_SHEN_CAT[s] === c)
  const mainAt = (s: string) => {
    const out: number[] = []
    mainZhi.forEach((x, i) => {
      if (x === s) out.push(i)
    })
    return out
  }
  const strong = (s: string) => tou(s) || mainAt(s).length > 0
  const strongCat = (c: ShishenCat) =>
    pillars.some((p, i) => {
      if (i !== 2 && SHI_SHEN_CAT[p.shishen] === c) return true
      return SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === c
    })

  const countOf = (s: string) => {
    let n = 0
    for (const g of ganSs) if (g === s) n++
    for (const z of allZhi) if (z === s) n++
    return n
  }
  const countCat = (c: ShishenCat) => {
    let n = 0
    for (const g of ganSs) if (SHI_SHEN_CAT[g] === c) n++
    for (const z of allZhi) if (SHI_SHEN_CAT[z] === c) n++
    return n
  }

  const ganWxCount = (wx: string) =>
    pillars.filter((p) => ganWuxing(p.gan) === wx).length
  const zhiMainWxCount = (wx: string) =>
    pillars.filter((p) => {
      const g = p.hideGans[0]
      return g && ganWuxing(g) === wx
    }).length
  const touWx = (wx: string) =>
    pillars.some((p, i) => i !== 2 && ganWuxing(p.gan) === wx)
  const rootWx = (wx: string) => zhiMainWxCount(wx) > 0
  const rootExt = (wx: string) =>
    pillars.some((p) => {
      const b = p.hideGans[0]
      const m = p.hideGans[1]
      return (b && ganWuxing(b) === wx) || (m && ganWuxing(m) === wx)
    })

  // 天干位置 (0=年 1=月 3=时) — 不含日柱
  const ganPosOf = (s: string): number[] => {
    const out: number[] = []
    if (pillars[0].shishen === s) out.push(0)
    if (pillars[1].shishen === s) out.push(1)
    if (pillars[3].shishen === s) out.push(3)
    return out
  }
  const adjacentTou = (s1: string, s2: string) => {
    const p1 = ganPosOf(s1)
    const p2 = ganPosOf(s2)
    for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
    return false
  }

  const dayYang = ['甲', '丙', '戊', '庚', '壬'].includes(dayGan)

  const mzChong = CHONG_PAIR[monthP.zhi as string]
  const monthZhiBeingChong = mzChong
    ? [yearP.zhi, dayP.zhi, hourP.zhi].includes(mzChong)
    : false

  // —— 岁运柱 ——
  const dayunPillar = extraPillars.find((p) => p.label === '大运')
  const liunianPillar = extraPillars.find((p) => p.label === '流年')
  const extraGanWxCount = (wx: string) =>
    extraPillars.filter((p) => ganWuxing(p.gan) === wx).length
  const extraZhiMainWxCount = (wx: string) =>
    extraPillars.filter((p) => zhiWuxing(p.zhi) === wx).length

  return {
    pillars,
    dayGan,
    dayZhi: dayP.zhi as Zhi,
    dayGz: dayP.gan + dayP.zhi,
    monthZhi: monthP.zhi as Zhi,
    yearZhi: yearP.zhi as Zhi,
    dayWx,
    season,
    dayYang,
    level,
    tou, touCat, zang, has, hasCat, mainAt, strong, strongCat,
    countOf, countCat,
    ganWxCount, zhiMainWxCount, touWx, rootWx, rootExt,
    deLing, deDi, deShi, shenWang, shenRuo,
    adjacentTou,
    monthCat,
    monthZhiBeingChong,
    extraPillars,
    dayunPillar,
    liunianPillar,
    extraGanWxCount,
    extraZhiMainWxCount,
  }
}
