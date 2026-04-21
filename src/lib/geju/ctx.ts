import {
  TRIAD_MAP,
  triadOf,
  seasonOf,
  GENERATED_BY,
  CONTROLLED_BY,
  CONTROLS,
  type Gan,
  type Zhi,
  type Season,
} from '@jabberwocky238/bazi-engine'
import type { Pillar, ShishenCat } from '../store'
import { ganWuxing, zhiWuxing } from '@jabberwocky238/bazi-engine'
import { analyzeStrength, type StrengthAnalysis } from '../strength'

/** 日主禄位 (十干禄支)。engine 未在顶层导出，在此本地保留。 */
export const LU: Record<Gan, Zhi> = {
  甲: '寅', 乙: '卯',
  丙: '巳', 丁: '午',
  戊: '巳', 己: '午',
  庚: '申', 辛: '酉',
  壬: '亥', 癸: '子',
}

/** 日主阳刃位。engine 未在顶层导出，在此本地保留。 */
export const YANG_REN: Record<Gan, Zhi> = {
  甲: '卯', 乙: '寅',
  丙: '午', 丁: '巳',
  戊: '午', 己: '巳',
  庚: '酉', 辛: '申',
  壬: '子', 癸: '亥',
}

export const KUIGANG_DAY = new Set(['庚辰', '庚戌', '壬辰', '戊戌'])

export const WX_GENERATED_BY: Record<string, string> = GENERATED_BY
export const WX_CONTROLLED_BY: Record<string, string> = CONTROLLED_BY
export const WX_CONTROLS: Record<string, string> = CONTROLS

export const SEASON_BY_ZHI: Record<string, Season> = {
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

export interface CtxPillars {
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar
  dayun?: Pillar
  liunian?: Pillar
}

export class Ctx {
  pillars: CtxPillars
  season: '春' | '夏' | '秋' | '冬' | ''
  /** 日主阳干 (甲/丙/戊/庚/壬) */
  dayYang: boolean

  constructor(pillars: CtxPillars) {
    this.pillars = pillars
    try {
      this.season = seasonOf(pillars.month.zhi)
    } catch {
      this.season = ''
    }
    this.dayYang = (pillars.day.gan) in { 甲: 1, 丙: 1, 戊: 1, 庚: 1, 壬: 1 }
  }

  get strength(): StrengthAnalysis | null {
    return analyzeStrength([this.pillars.year, this.pillars.month, this.pillars.day, this.pillars.hour])
  }

  get ganSet(): Set<Gan> {
    return new Set([
      this.pillars.year.gan,
      this.pillars.month.gan,
      this.pillars.day.gan,
      this.pillars.hour.gan,
    ])
  }
  // —— 十神定性查询 ——
  tou(s: Gan): boolean {
    return this.ganSet.has(s)
  }
  touCat(c: ShishenCat): boolean {
    return (this.ganSet as Set<any>).some((s) => SHI_SHEN_CAT[s] === c)
  }
  zang(s: Zhi): boolean {
    return this.allZhiArr.includes(s)
  }
  has(s: string): boolean {
    return this.ganSet.has(s) || this.allZhiArr.includes(s)
  }
  hasCat(c: ShishenCat): boolean {
    return (
      this.ganSs.some((s) => SHI_SHEN_CAT[s] === c) ||
      this.allZhiArr.some((s) => SHI_SHEN_CAT[s] === c)
    )
  }
  mainAt(s: string): number[] {
    const out: number[] = []
    this.mainZhiArr.forEach((x, i) => {
      if (x === s) out.push(i)
    })
    return out
  }
  strong(s: string): boolean {
    return this.tou(s) || this.mainAt(s).length > 0
  }
  strongCat(c: ShishenCat): boolean {
    return this.mainArr.some((p, i) => {
      if (i !== 2 && SHI_SHEN_CAT[p.shishen] === c) return true
      return SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === c
    })
  }

  // —— 数量统计 (干位 + 所有藏干位) ——
  countOf(s: string): number {
    let n = 0
    for (const g of this.ganSs) if (g === s) n++
    for (const z of this.allZhiArr) if (z === s) n++
    return n
  }
  countCat(c: ShishenCat): number {
    let n = 0
    for (const g of this.ganSs) if (SHI_SHEN_CAT[g] === c) n++
    for (const z of this.allZhiArr) if (SHI_SHEN_CAT[z] === c) n++
    return n
  }

  // —— 五行定性查询 (按"柱数"计数) ——
  ganWxCount(wx: string): number {
    return this.mainArr.filter((p) => ganWuxing(p.gan) === wx).length
  }
  zhiMainWxCount(wx: string): number {
    return this.mainArr.filter((p) => {
      const g = p.hideGans[0]
      return !!g && ganWuxing(g) === wx
    }).length
  }
  touWx(wx: string): boolean {
    return this.mainArr.some((p, i) => i !== 2 && ganWuxing(p.gan) === wx)
  }
  rootWx(wx: string): boolean {
    return this.zhiMainWxCount(wx) > 0
  }
  /** 本气 或 中气 含此五行 (如寅中丙、戌中丁算火根)。 */
  rootExt(wx: string): boolean {
    return this.mainArr.some((p) => {
      const b = p.hideGans[0]
      const m = p.hideGans[1]
      return (!!b && ganWuxing(b) === wx) || (!!m && ganWuxing(m) === wx)
    })
  }

  // —— 位置关系 ——
  private ganPosOf(s: string): number[] {
    const out: number[] = []
    if (this.mainArr[0].shishen === s) out.push(0)
    if (this.mainArr[1].shishen === s) out.push(1)
    if (this.mainArr[3].shishen === s) out.push(3)
    return out
  }
  adjacentTou(s1: string, s2: string): boolean {
    const p1 = this.ganPosOf(s1)
    const p2 = this.ganPosOf(s2)
    for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
    return false
  }

  // —— 岁运五行计数 ——
  /** 岁运柱（含大运+流年）天干五行计数。 */
  extraGanWxCount(wx: string): number {
    return this.extraArr.filter((p) => ganWuxing(p.gan) === wx).length
  }
  /** 岁运柱地支五行计数（按地支本气/主气）。 */
  extraZhiMainWxCount(wx: string): number {
    return this.extraArr.filter((p) => zhiWuxing(p.zhi) === wx).length
  }
}

