import {
  TRIAD_MAP,
  triadOf,
  GENERATED_BY,
  CONTROLLED_BY,
  CONTROLS,
  ganWuxing,
  zhiWuxing,
  seasonOf,
  type Gan,
  type Zhi,
  type Season,
  type WuXing,
  type Shishen,
  type ShishenCat,
  analyzeGanZhi,
  relationOf,
  wuxingGan,
  type GanZhiAnalysis,
} from '@jabberwocky238/bazi-engine'
import type { DetailedPillar } from '../base'
import { CHONG_PAIR, YANG_GANS, SHI_SHEN_CAT } from '../base'
import type { StrengthDerived } from '../strength'

export type { Season, ShishenCat } from '@jabberwocky238/bazi-engine'

/**
 * 格局判定用 — 上下文。直接使用 @jabberwocky238/bazi-engine 的 Calculator。
 * detector 直接用 ctx.calc 取 engine 原语；ctx 只补 engine 缺的十神原语 + 派生字段 + strength/extras。
 */
import { Calculator } from '@jabberwocky238/bazi-engine'
import type { BaziInput } from '@jabberwocky238/bazi-engine'
type SanHeFinding = GanZhiAnalysis['地支三合'][number]
type SanHeJuInfo = Extract<SanHeFinding, { sub: '三合局' }>
type SanHuiFinding = GanZhiAnalysis['地支三会'][number]

export class GejuContext {
  calc: Calculator
  state: Record<string, any> = {} // 供各 Detector 存取的任意状态容器

  constructor(
    public bazi: BaziInput,
    private _strength?: StrengthDerived,
    extras?: { dayun?: DetailedPillar; liunian?: DetailedPillar },
  ) {
    this.calc = new Calculator(bazi)
    if (extras) {
      this.state.extrasInput = extras
    }
  }

  set extraPillars(pillars: DetailedPillar[]) {
    this.state.extraPillars = pillars
  }

  get pillars(): DetailedPillar[] {
    if (!this.state.pillars) this.state.pillars = this.calc.pillars()
    return this.state.pillars
  }

  get riZhu(): DetailedPillar['gan'] {
    if (!this.state.riZhu) this.state.riZhu = this.pillars[2].gan
    return this.state.riZhu
  }
  get yueLing(): DetailedPillar['zhi'] {
    if (!this.state.yueLing) this.state.yueLing = this.pillars[1].zhi
    return this.state.yueLing
  }

  touGan(gan: Gan, pos?: 0 | 1 | 2 | 3): boolean {
    if (pos) {
      return this.pillars[pos].gan.name === gan
    }
    for (const pillar of this.pillars) {
      if (pillar.gan.name === gan) return true
    }
    return false
  }
  rootGan(gan: Gan, pos?: 0 | 1 | 2 | 3): boolean {
    if (pos) {
      const cangGan = this.pillars[pos].zhi.cangGan
      return cangGan.some(cg => cg.name === gan)
    }
    for (const pillar of this.pillars) {
      if (pillar.zhi.cangGan.some(cg => cg.name === gan)) return true
    }
    return false
  }

  get ganzhiAnalysis(): ReturnType<typeof analyzeGanZhi> {
    if (!this.state.ganzhiAnalysis) {
      this.state.ganzhiAnalysis = analyzeGanZhi(this.pillars.map(p => { return { gan: p.gan.name, zhi: p.zhi.name } }))
    }
    return this.state.ganzhiAnalysis
  }

  sanHeJu(): SanHeFinding[] {
    return this.ganzhiAnalysis?.地支三合 ?? []
  }
  sanHuiJu(): SanHuiFinding[] {
    return this.ganzhiAnalysis?.地支三会 ?? []
  }
  // 五行对应的阳干和阴干
  wuxingGan(wuxing: WuXing): [Gan, Gan] {
    return [wuxingGan(wuxing, true), wuxingGan(wuxing, false)]
  }

  // ———————————————————————————————————————————————
  // 派生命局字段 (旧 snapshot 上 BaziSnapshot 暴露, detector 直接用 ctx.同名)
  // ———————————————————————————————————————————————

  get dayGan(): Gan { return this.riZhu.name }
  get dayZhi(): Zhi { return this.pillars[2].zhi.name }
  get dayGz(): string { return `${this.dayGan}${this.dayZhi}` }
  get dayWx(): WuXing { return this.pillars[2].gan.wuxing }
  get dayYang(): boolean { return YANG_GANS.has(this.dayGan) }
  get monthZhi(): Zhi { return this.yueLing.name }
  /** 月令是否被四柱任一非月支六冲。 */
  get monthZhiBeingChong(): boolean {
    const pair = CHONG_PAIR[this.monthZhi]
    if (!pair) return false
    return this.pillars.some((p, i) => i !== 1 && p.zhi.name === pair)
  }
  get mainArr(): DetailedPillar[] { return this.pillars }
  get yearZhi(): Zhi { return this.pillars[0].zhi.name }
  /** 月令季节 (seasonOf(monthZhi))。 */
  get season(): Season { return seasonOf(this.monthZhi) }
  /** 月干十神类别 (与 BaziDerived.monthCat 一致)。 */
  get monthCat(): ShishenCat | '' {
    const s = this.pillars[1].gan.shishen
    return s === '日主' ? '' : (SHI_SHEN_CAT[s as Shishen] ?? '')
  }
  /** 月支藏干十神 (月令本/中/余气)。 */
  get monthHideShishen(): Shishen[] {
    return this.yueLing.cangGan.map(cg => cg.shishen)
  }

  // ———————————————————————————————————————————————
  // engine 缺的十神原语 — 基于 calc.shishen() 派生
  // ———————————————————————————————————————————————

  private get _ss() {
    if (!this.state.ss) this.state.ss = this.calc.shishen()
    return this.state.ss
  }
  /** 指定类别是否透干 (年/月/时天干)。 */
  touCat(c: ShishenCat): boolean {
    return this._ss.tou().some((s: Shishen) => SHI_SHEN_CAT[s] === c)
  }
  /** 指定类别是否透或藏。 */
  hasCat(c: ShishenCat): boolean {
    return this._ss.has().some((s: Shishen) => SHI_SHEN_CAT[s] === c)
  }
  /** 透该十神的柱索引 (年/月/时, 排除日主)。 */
  mainAt(s: Shishen): number[] {
    const out: number[] = []
    this.pillars.forEach((p, i) => {
      if (i !== 2 && p.gan.shishen === s) out.push(i)
    })
    return out
  }
  /** 各柱本气十神 (地支藏干首字)。 */
  get mainZhiArr(): Shishen[] {
    return this.pillars.map(p => p.zhi.cangGan[0]?.shishen).filter((s): s is Shishen => !!s)
  }
  /** 全部藏干十神 (各柱本/中/余气铺平, 对应旧 allZhiArr / hideShishen)。 */
  get allZhiArr(): Shishen[] {
    return this.pillars.flatMap(p => p.zhi.cangGan.map(c => c.shishen))
  }
  /** 指定十神出现次数 (透 + 藏)。 */
  countOf(s: Shishen): number { return this._ss.count(s) }
  /** 本气或中气含此五行 (委托 calc.rootExt)。 */
  rootExt(wx: WuXing): boolean { return this.calc.rootExt(wx) }
  /** 指定五行是否有根 (透 + 藏, 布尔包装 calc.rootWx)。 */
  rootWx(wx: WuXing): boolean { return this.calc.rootWx(wx)[0] }

  // ———————————————————————————————————————————————
  // 身强弱 / 岁运
  // ———————————————————————————————————————————————

  get strength(): StrengthDerived {
    return this._strength ?? {
      analysis: null,
      level: '',
      deLing: false,
      deDi: false,
      deShi: false,
      shenWang: false,
      shenRuo: false,
    }
  }

  get extras(): ExtrasView {
    if (!this.state.extrasView) {
      this.state.extrasView = createExtrasView(this.state.extrasInput ?? {})
    }
    return this.state.extrasView
  }
}

/** 岁运视图 — 由 {dayun, liunian} 派生。 */
export interface ExtrasView {
  active: boolean
  extraArr: DetailedPillar[]
  /** 岁运柱数组别名 (与 extraArr 同)。 */
  extraPillars: DetailedPillar[]
  /** 岁运天干是否透该十神。 */
  tou(s: Shishen): boolean
  /** 岁运天干是否透该类别。 */
  touCat(c: ShishenCat): boolean
  /** 岁运是否含该十神 (天干透 ∪ 地支藏)。 */
  has(s: Shishen): boolean
  /** 岁运是否含该类别 (天干透 ∪ 地支藏)。 */
  hasCat(c: ShishenCat): boolean
  extraGanWxCount(wx: WuXing): number
  extraZhiMainWxCount(wx: WuXing): number
}

function createExtrasView(input: { dayun?: DetailedPillar; liunian?: DetailedPillar }): ExtrasView {
  const arr: DetailedPillar[] = []
  if (input.dayun) arr.push(input.dayun)
  if (input.liunian) arr.push(input.liunian)
  const ganShishens: Shishen[] = arr.map(p => p.gan.shishen as Shishen).filter(Boolean)
  const allShishens: Shishen[] = arr.flatMap(p =>
    [p.gan.shishen as Shishen, ...p.zhi.cangGan.map(c => c.shishen)],
  ).filter(Boolean)
  return {
    active: arr.length > 0,
    extraArr: arr,
    extraPillars: arr,
    tou: (s: Shishen) => ganShishens.includes(s),
    touCat: (c: ShishenCat) => ganShishens.some(s => SHI_SHEN_CAT[s] === c),
    has: (s: Shishen) => allShishens.includes(s),
    hasCat: (c: ShishenCat) => allShishens.some(s => SHI_SHEN_CAT[s] === c),
    extraGanWxCount: (wx) => arr.filter(p => ganWuxing(p.gan.name) === wx).length,
    extraZhiMainWxCount: (wx) => arr.filter(p => zhiWuxing(p.zhi.name) === wx).length,
  }
}


// ————————————————————————————————————————————————————————
// 类型
// ————————————————————————————————————————————————————————

export type GejuQuality = 'good' | 'bad' | 'neutral'
export type GejuCategory = '从格' | '十神格' | '五行格' | '专旺格' | '特殊格' | '正格'

/**
 * 岁运段 — 聚合所有与大运/流年判定相关的状态。
 * 替代旧的扁平 suiyunSpecific / suiyunTrigger / suiyunBreak / suiyunDefaultTrigger / suiyunConquer。
 */
export interface GejuSuiyun {
  /** 该判定本身是否为岁运特定（旧 suiyunSpecific）。 */
  isSuiyun: boolean
  /** 原局不成格，岁运成格（大运/流年补齐）。 */
  Trigger: boolean
  /** 原局成格，岁运破格（大运/流年冲散）。 */
  Break: boolean
  /** 默认成格。 */
  DefaultTrigger: boolean
  /** 岁运冲害。 */
  Conquer: boolean
}

export const EMPTY_SUIYUN: GejuSuiyun = {
  isSuiyun: false,
  Trigger: false,
  Break: false,
  DefaultTrigger: false,
  Conquer: false,
}

/** 显 = 已成格当前可见；隐 = 仅潜在（岁运依赖且未默认成 / 未触发）。 */
export type GejuVisibility = '显' | '隐'

/** 由 岁运 段派生 显隐：仅 isSuiyun 而无 DefaultTrigger / Trigger 撑起时为隐。 */
export function deriveVisibility(s: GejuSuiyun): GejuVisibility {
  if (s.isSuiyun && !s.DefaultTrigger && !s.Trigger) return '隐'
  return '显'
}

export type GejuHit = {
  name: string
  note: string
  /** 岁运段（聚合 suiyun 前缀状态）。 */
  岁运?: GejuSuiyun
  /** 显隐：原局已成格(显) vs 仅岁运潜在/需要岁运补齐(隐)。 */
  显隐?: GejuVisibility // 默认undefined为显
  /** 贵格变体。 */
  guigeVariant?: string
}

/** 大运序列相对命局的配合度元信息；由 detectGeju 调用方按需注入。 */
export interface DaYunMeta {
  /** 大运顺行：阳男阴女顺，阴男阳女逆。 */
  forward: boolean
  /** 从当前选中大运起连续落入用神/喜神五行的大运步数（含当前步）。 */
  favorableStreak: number
  /** 从当前选中大运起连续落入忌神五行的大运步数（含当前步）。 */
  avoidStreak: number
}

export interface CtxPillars {
  year: DetailedPillar
  month: DetailedPillar
  day: DetailedPillar
  hour: DetailedPillar
  dayun?: DetailedPillar
  liunian?: DetailedPillar
}

/** v2 detector: 接收 GejuContext, 返回命中或 null。 */
export type Detector = (ctx: GejuContext) => GejuHit | null

// ————————————————————————————————————————————————————————
// 常量（原 lib/geju/ctx.ts 提供）
// SHI_SHEN_CAT / CHONG_PAIR 由 lib/shishen.ts 给出，这里转出，detectors 沿用
// 旧路径 `from '../../types'`。
// ————————————————————————————————————————————————————————

export { SHI_SHEN_CAT, CHONG_PAIR } from '../base'

export const KUIGANG_DAY = new Set(['庚辰', '庚戌', '壬辰', '戊戌'])

/** 日主禄位（十干禄支）。 */
export const LU: Record<Gan, Zhi> = {
  甲: '寅', 乙: '卯',
  丙: '巳', 丁: '午',
  戊: '巳', 己: '午',
  庚: '申', 辛: '酉',
  壬: '亥', 癸: '子',
}

/** 日主阳刃位。 */
export const YANG_REN: Record<Gan, Zhi> = {
  甲: '卯', 乙: '寅',
  丙: '午', 丁: '巳',
  戊: '午', 己: '巳',
  庚: '酉', 辛: '申',
  壬: '子', 癸: '亥',
}

export const WX_GENERATED_BY: Record<string, string> = GENERATED_BY
export const WX_CONTROLLED_BY: Record<string, string> = CONTROLLED_BY
export const WX_CONTROLS: Record<string, string> = CONTROLS

export function yimaFrom(zhi: string): string | undefined {
  try {
    return TRIAD_MAP[triadOf(zhi as Zhi)]['驿马']
  } catch {
    return undefined
  }
}
