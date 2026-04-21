import {
  TRIAD_MAP,
  triadOf,
  seasonOf,
  ganWuxing,
  zhiWuxing,
  GENERATED_BY,
  CONTROLLED_BY,
  CONTROLS,
  ShishenMap,
  type Gan,
  type Zhi,
  type Season,
  type Shishen,
  type ShishenCat,
  type WuXing,
} from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'
import { analyzeStrength, type StrengthAnalysis, type StrengthLevel } from '../strength'

export type { ShishenCat }

/** 日主禄位 (十干禄支)。engine 未在顶层导出，本地保留。 */
export const LU: Record<Gan, Zhi> = {
  甲: '寅', 乙: '卯',
  丙: '巳', 丁: '午',
  戊: '巳', 己: '午',
  庚: '申', 辛: '酉',
  壬: '亥', 癸: '子',
}

/** 日主阳刃位。engine 未在顶层导出，本地保留。 */
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

/** 十神 → 类别映射 (依 engine ShishenMap 派生)。 */
export const SHI_SHEN_CAT: Record<string, ShishenCat> = Object.fromEntries(
  Object.entries(ShishenMap).map(([name, def]) => [name, def.category]),
) as Record<string, ShishenCat>

const YANG_GANS: ReadonlySet<string> = new Set(['甲', '丙', '戊', '庚', '壬'])

const STRONG_LV = new Set<StrengthLevel>(['身极旺', '身旺', '身中强', '身中(偏强)'])
const WEAK_LV = new Set<StrengthLevel>(['身略弱', '身弱', '身极弱', '近从弱', '身中(偏弱)'])

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
  season: Season | ''
  /** 日主阳干 (甲/丙/戊/庚/壬) */
  dayYang: boolean

  private _strength: StrengthAnalysis | null | undefined

  constructor(pillars: CtxPillars) {
    this.pillars = pillars
    try {
      this.season = seasonOf(pillars.month.zhi)
    } catch {
      this.season = ''
    }
    this.dayYang = YANG_GANS.has(pillars.day.gan)
  }

  // —— 日主 & 月令便利访问器 ——
  get dayGan(): Gan { return this.pillars.day.gan }
  get dayZhi(): Zhi { return this.pillars.day.zhi }
  get dayGz(): string { return `${this.dayGan}${this.dayZhi}` }
  get dayWx(): WuXing { return ganWuxing(this.dayGan) }
  get yearZhi(): Zhi { return this.pillars.year.zhi }
  get monthZhi(): Zhi { return this.pillars.month.zhi }
  get monthCat(): ShishenCat | '' {
    const main = this.pillars.month.hideShishen[0]
    return main ? (SHI_SHEN_CAT[main] ?? '') : ''
  }
  /** 月支是否被其他柱地支所冲。 */
  get monthZhiBeingChong(): boolean {
    const mc = CHONG_PAIR[this.monthZhi]
    if (!mc) return false
    return [this.pillars.year.zhi, this.pillars.day.zhi, this.pillars.hour.zhi].includes(mc as Zhi)
  }

  // —— 身强弱 ——
  get strength(): StrengthAnalysis | null {
    if (this._strength === undefined) {
      this._strength = analyzeStrength(this.mainArr)
    }
    return this._strength
  }
  get level(): StrengthLevel | '' {
    return this.strength?.level ?? ''
  }
  get deLing(): boolean {
    return this.strength?.deLing ?? false
  }
  get deDi(): boolean {
    const s = this.strength
    return s ? s.roots[2].kind !== 'none' : false
  }
  get deShi(): boolean {
    return (this.strength?.ganPoints ?? 0) > 0
  }
  get shenWang(): boolean {
    const lv = this.level
    return !!lv && STRONG_LV.has(lv as StrengthLevel)
  }
  get shenRuo(): boolean {
    const lv = this.level
    return !!lv && WEAK_LV.has(lv as StrengthLevel)
  }

  // —— 柱数组访问器 ——
  /** 四柱数组 [年, 月, 日, 时]。 */
  get mainArr(): Pillar[] {
    return [this.pillars.year, this.pillars.month, this.pillars.day, this.pillars.hour]
  }
  /** 岁运柱 (大运 / 流年，存在才入列)。 */
  get extraArr(): Pillar[] {
    const out: Pillar[] = []
    if (this.pillars.dayun) out.push(this.pillars.dayun)
    if (this.pillars.liunian) out.push(this.pillars.liunian)
    return out
  }
  /** 岁运柱数组 (别名，兼容旧消费者)。 */
  get extraPillars(): Pillar[] {
    return this.extraArr
  }

  /** 年/月/时 三柱天干 Set (不含日主)。用于判天干具体出现 (如 '甲' / '庚')。 */
  get ganSet(): Set<Gan> {
    return new Set([
      this.pillars.year.gan,
      this.pillars.month.gan,
      this.pillars.hour.gan,
    ])
  }
  /** 年/月/时 三柱十神列表 (不含日主 "日主")。 */
  get ganSs(): Shishen[] {
    const out: Shishen[] = []
    for (const p of [this.pillars.year, this.pillars.month, this.pillars.hour]) {
      const s = p.shishen
      if (s && (s as string) !== '日主') out.push(s)
    }
    return out
  }
  /** 四柱地支本气十神 (按柱索引对齐；未知位返回 '')。 */
  get mainZhiArr(): string[] {
    return this.mainArr.map((p) => (p.hideShishen[0] ?? '') as string)
  }
  /** 四柱所有藏干十神展平。 */
  get allZhiArr(): Shishen[] {
    return this.mainArr.flatMap((p) => p.hideShishen)
  }

  // —— 十神定性查询 ——
  /** 十神 s 是否透 (出现在 年/月/时 天干位)。 */
  tou(s: Shishen): boolean {
    return (this.ganSs as readonly Shishen[]).includes(s)
  }
  touCat(c: ShishenCat): boolean {
    return this.ganSs.some((s) => SHI_SHEN_CAT[s] === c)
  }
  /** 十神 s 是否藏 (出现在任一藏干位)。 */
  zang(s: Shishen): boolean {
    return (this.allZhiArr as readonly Shishen[]).includes(s)
  }
  has(s: Shishen): boolean {
    return this.tou(s) || this.zang(s)
  }
  hasCat(c: ShishenCat): boolean {
    return this.touCat(c) || this.allZhiArr.some((s) => SHI_SHEN_CAT[s] === c)
  }
  /** 十神 s 作为地支本气出现的位置下标 (0..3)。 */
  mainAt(s: Shishen): number[] {
    const out: number[] = []
    this.mainZhiArr.forEach((x, i) => {
      if (x === s) out.push(i)
    })
    return out
  }
  strong(s: Shishen): boolean {
    return this.tou(s) || this.mainAt(s).length > 0
  }
  strongCat(c: ShishenCat): boolean {
    return this.mainArr.some((p, i) => {
      if (i !== 2 && SHI_SHEN_CAT[p.shishen as string] === c) return true
      const h = p.hideShishen[0]
      return !!h && SHI_SHEN_CAT[h] === c
    })
  }

  // —— 数量统计 (干位 + 所有藏干位) ——
  countOf(s: Shishen): number {
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
  ganWxCount(wx: WuXing): number {
    return this.mainArr.filter((p) => ganWuxing(p.gan) === wx).length
  }
  zhiMainWxCount(wx: WuXing): number {
    return this.mainArr.filter((p) => {
      const g = p.hideGans[0]
      return !!g && ganWuxing(g) === wx
    }).length
  }
  touWx(wx: WuXing): boolean {
    return this.mainArr.some((p, i) => i !== 2 && ganWuxing(p.gan) === wx)
  }
  rootWx(wx: WuXing): boolean {
    return this.zhiMainWxCount(wx) > 0
  }
  /** 本气 或 中气 含此五行 (如寅中丙、戌中丁算火根)。 */
  rootExt(wx: WuXing): boolean {
    return this.mainArr.some((p) => {
      const b = p.hideGans[0]
      const m = p.hideGans[1]
      return (!!b && ganWuxing(b) === wx) || (!!m && ganWuxing(m) === wx)
    })
  }

  // —— 位置关系 ——
  private ganPosOf(s: Shishen): number[] {
    const out: number[] = []
    if (this.mainArr[0].shishen === s) out.push(0)
    if (this.mainArr[1].shishen === s) out.push(1)
    if (this.mainArr[3].shishen === s) out.push(3)
    return out
  }
  /** 两个十神是否在相邻柱天干紧贴 (差 1)。 */
  adjacentTou(s1: Shishen, s2: Shishen): boolean {
    const p1 = this.ganPosOf(s1)
    const p2 = this.ganPosOf(s2)
    for (const a of p1) for (const b of p2) if (Math.abs(a - b) === 1) return true
    return false
  }

  // —— 岁运五行计数 ——
  /** 岁运柱（含大运+流年）天干五行计数。 */
  extraGanWxCount(wx: WuXing): number {
    return this.extraArr.filter((p) => ganWuxing(p.gan) === wx).length
  }
  /** 岁运柱地支五行计数（按地支本气/主气）。 */
  extraZhiMainWxCount(wx: WuXing): number {
    return this.extraArr.filter((p) => zhiWuxing(p.zhi) === wx).length
  }
}
