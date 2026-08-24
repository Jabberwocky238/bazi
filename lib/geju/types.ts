import {
  TRIAD_TABLE_WRAPPER,
  WUXING_BY_RELATION_TABLE,
  GAN,
  ZHI,
  GanC,
  ZhiC,
  PillarC,
  BaziInputC,
  type Gan,
  type Zhi,
  type Season,
  type WuXing,
  type Shishen,
  type ShishenCat,
  analyzeGanZhi,
  WuXingC,
  ShishenC,
  ShishenCC,
  shishenOf,
  type ShishenCalculator,
  type GanZhiAnalysis,
  type HeHuiC,
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
/** 地支关系命中 (1.1.0 统一为 地支 数组, 按 kind 过滤取三合/三会)。 */
type DiZhiSuiYunHit = GanZhiAnalysis['地支'][number]
/** 三合/三会命中 —— rule 必为合会族 (HeHuiC), 携化气信息。 */
type HeHuiSuiYunHit = Omit<DiZhiSuiYunHit, 'hit'> & {
  hit: Omit<DiZhiSuiYunHit['hit'], 'rule'> & { rule: HeHuiC }
}

export class GejuContext {
  calc: Calculator
  state: Record<string, any> = {} // 供各 Detector 存取的任意状态容器

  constructor(
    public bazi: BaziInput,
    private _strength?: StrengthDerived,
    extras?: { dayun?: DetailedPillar; liunian?: DetailedPillar },
  ) {
    this.calc = new Calculator(BaziInputC.from(bazi))
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

  /** 日主天干 (1.2.0: 柱的干支收在 .pillar 下)。 */
  get riZhu(): GanC {
    if (!this.state.riZhu) this.state.riZhu = this.pillars[2].pillar.gan
    return this.state.riZhu
  }
  /** 月令地支。 */
  get yueLing(): ZhiC {
    if (!this.state.yueLing) this.state.yueLing = this.pillars[1].pillar.zhi
    return this.state.yueLing
  }

  touGan(gan: Gan, pos?: 0 | 1 | 2 | 3): boolean {
    if (pos) {
      return this.pillars[pos].pillar.gan.str === gan
    }
    return this.pillars.some(p => p.pillar.gan.str === gan)
  }
  rootGan(gan: Gan, pos?: 0 | 1 | 2 | 3): boolean {
    if (pos) {
      return this.pillars[pos].pillar.zhi.canggan().some(cg => cg.str === gan)
    }
    return this.pillars.some(p => p.pillar.zhi.canggan().some(cg => cg.str === gan))
  }

  get ganzhiAnalysis(): ReturnType<typeof analyzeGanZhi> {
    if (!this.state.ganzhiAnalysis) {
      this.state.ganzhiAnalysis = analyzeGanZhi(
        this.pillars.map(p => ({ gan: p.pillar.gan.str, zhi: p.pillar.zhi.str })),
        [],
      )
    }
    return this.state.ganzhiAnalysis
  }

  /** 三合命中 (1.1.0: 从 地支 数组按 kind 过滤)。 */
  sanHeJu(): HeHuiSuiYunHit[] {
    return (this.ganzhiAnalysis?.地支 ?? [])
      .filter(h => h.hit.kind === '三合') as unknown as HeHuiSuiYunHit[]
  }
  /** 三会命中。 */
  sanHuiJu(): HeHuiSuiYunHit[] {
    return (this.ganzhiAnalysis?.地支 ?? [])
      .filter(h => h.hit.kind === '三会') as unknown as HeHuiSuiYunHit[]
  }
  // 五行对应的阳干和阴干
  wuxingGan(wuxing: WuXing): [Gan, Gan] {
    const wx = WuXingC.from(wuxing)
    return [wx.gan(true).str, wx.gan(false).str]
  }

  // ———————————————————————————————————————————————
  // 派生命局字段 (旧 snapshot 上 BaziSnapshot 暴露, detector 直接用 ctx.同名)
  // ———————————————————————————————————————————————

  get dayGan(): Gan { return this.riZhu.str }
  get dayZhi(): Zhi { return this.pillars[2].pillar.zhi.str }
  get dayGz(): string { return `${this.dayGan}${this.dayZhi}` }
  get dayWx(): WuXing { return this.pillars[2].pillar.gan.wuxing.str }
  get dayYang(): boolean { return YANG_GANS.has(this.dayGan) }
  get monthZhi(): Zhi { return this.yueLing.str }
  /** 月令是否被四柱任一非月支六冲。 */
  get monthZhiBeingChong(): boolean {
    const pair = CHONG_PAIR[this.monthZhi]
    if (!pair) return false
    return this.pillars.some((p, i) => i !== 1 && p.pillar.zhi.str === pair)
  }
  get mainArr(): DetailedPillar[] { return this.pillars }
  get yearZhi(): Zhi { return this.pillars[0].pillar.zhi.str }
  /** 月令季节 (seasonOf(monthZhi))。 */
  get season(): Season { return ZhiC.from(this.monthZhi).season().season }
  /** 月干十神类别 (与 BaziDerived.monthCat 一致)。 */
  get monthCat(): ShishenCat | '' {
    const p = this.pillars[1]
    if (p.isRizhu) return ''
    return shishenOf(this.riZhu, p.pillar.gan).cat.str
  }
  /** 月支藏干十神 (月令本/中/余气)。 */
  get monthHideShishen(): Shishen[] {
    return this.yueLing.canggan().map((cg: GanC) => shishenOf(this.riZhu, cg).str)
  }

  // ———————————————————————————————————————————————
  // engine 缺的十神原语 — 基于 calc.shishen() 派生
  // ———————————————————————————————————————————————

  private get _ss(): ShishenCalculator {
    if (!this.state.ss) this.state.ss = this.calc.shishen()
    return this.state.ss
  }
  /**
   * 十神门面 —— detector 一律传十神/类别的**字符串**, 这里转成 engine 的
   * ShishenC / ShishenCC 再委托。返回值保持 engine 的 [命中, 柱索引] 形状。
   */
  get ss() {
    const raw = this._ss
    return {
      tou: (s: Shishen): [boolean, number[]] => raw.tou(ShishenC.from(s)),
      zang: (s: Shishen): [boolean, number[]] => raw.zang(ShishenC.from(s)),
      has: (s: Shishen): [boolean, number[]] => raw.has(ShishenC.from(s)),
      count: (s: Shishen): number => raw.count(ShishenC.from(s)),
      countCat: (c: ShishenCat): number => raw.countCat(ShishenCC.from(c)),
      strong: (s: Shishen): boolean => raw.strong(ShishenC.from(s)),
      strongCat: (c: ShishenCat): boolean => raw.strongCat(ShishenCC.from(c)),
      adjacentTou: (a: Shishen, b: Shishen): boolean =>
        raw.adjacentTou(ShishenC.from(a), ShishenC.from(b)),
    }
  }
  /** 指定类别是否透干 (年/月/时天干)。 */
  touCat(c: ShishenCat): boolean {
    return this._ss.tou().some((s) => s.cat.str === c)
  }
  /** 指定类别是否透或藏。 */
  hasCat(c: ShishenCat): boolean {
    return this._ss.has().some((s) => s.cat.str === c)
  }
  /** 透该十神的柱索引 (年/月/时, 排除日主)。 */
  mainAt(s: Shishen): number[] {
    const out: number[] = []
    this.pillars.forEach((p, i) => {
      if (i !== 2 && !p.isRizhu && shishenOf(this.riZhu, p.pillar.gan).str === s) out.push(i)
    })
    return out
  }
  /** 各柱本气十神 (地支藏干首字)。 */
  get mainZhiArr(): Shishen[] {
    return this.pillars
      .map(p => p.pillar.zhi.canggan()[0])
      .filter((g): g is GanC => !!g)
      .map(g => shishenOf(this.riZhu, g).str)
  }
  /** 全部藏干十神 (各柱本/中/余气铺平, 对应旧 allZhiArr / hideShishen)。 */
  get allZhiArr(): Shishen[] {
    return this.pillars.flatMap(p =>
      p.pillar.zhi.canggan().map(c => shishenOf(this.riZhu, c).str),
    )
  }
  /** 指定十神出现次数 (透 + 藏)。 */
  countOf(s: Shishen): number { return this._ss.count(ShishenC.from(s)) }
  /** 某柱天干的十神 (日柱回 null); 十神不再挂在柱上, 依日主现场算。 */
  ganShishenOf(p: DetailedPillar): Shishen | null {
    return p.isRizhu ? null : shishenOf(this.riZhu, p.pillar.gan).str
  }
  /** 某柱地支本气 (藏干首字) 的十神。 */
  zhiMainShishenOf(p: DetailedPillar): Shishen | null {
    const g = p.pillar.zhi.canggan()[0]
    return g ? shishenOf(this.riZhu, g).str : null
  }
  /** 本气或中气含此五行 (委托 calc.rootExt)。 */
  rootExt(wx: WuXing): boolean { return this.calc.rootExt(WuXingC.from(wx)) }
  /** 指定五行是否有根 (透 + 藏, 布尔包装 calc.rootWx)。 */
  rootWx(wx: WuXing): boolean { return this.calc.rootWx(WuXingC.from(wx))[0] }
  /** 天干五行计数 (字符串门面, 委托 calc.ganWxCount)。 */
  ganWxCount(wx: WuXing): number { return this.calc.ganWxCount(WuXingC.from(wx)) }
  /** 地支本气五行计数 (字符串门面, 委托 calc.zhiMainWxCount)。 */
  zhiMainWxCount(wx: WuXing): number { return this.calc.zhiMainWxCount(WuXingC.from(wx)) }
  /** 指定五行是否透干 + 透的柱索引 (字符串门面, 委托 calc.touWx)。 */
  touWx(wx: WuXing): [boolean, number[]] { return this.calc.touWx(WuXingC.from(wx)) }

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
      this.state.extrasView = createExtrasView(this.state.extrasInput ?? {}, this.riZhu)
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

function createExtrasView(
  input: { dayun?: DetailedPillar; liunian?: DetailedPillar },
  dayGan: GanC,
): ExtrasView {
  const arr: DetailedPillar[] = []
  if (input.dayun) arr.push(input.dayun)
  if (input.liunian) arr.push(input.liunian)
  const ganShishens: Shishen[] = arr.map(p => shishenOf(dayGan, p.pillar.gan).str)
  const allShishens: Shishen[] = arr.flatMap(p => [
    shishenOf(dayGan, p.pillar.gan).str,
    ...p.pillar.zhi.canggan().map(c => shishenOf(dayGan, c).str),
  ])
  return {
    active: arr.length > 0,
    extraArr: arr,
    extraPillars: arr,
    tou: (s: Shishen) => ganShishens.includes(s),
    touCat: (c: ShishenCat) => ganShishens.some(s => SHI_SHEN_CAT[s] === c),
    has: (s: Shishen) => allShishens.includes(s),
    hasCat: (c: ShishenCat) => allShishens.some(s => SHI_SHEN_CAT[s] === c),
    extraGanWxCount: (wx) => arr.filter(p => p.pillar.gan.wuxing.str === wx).length,
    extraZhiMainWxCount: (wx) => arr.filter(p => p.pillar.zhi.wuxing.str === wx).length,
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

// 十干十二支序列直接用 engine 的 GAN / ZHI

/**
 * 按十二长生状态反查某天干对应的地支。
 * 1.2.0 把 luWeiOf/renWeiOf 收进 BaziInputC 实例方法 (需整盘上下文),
 * 而这里要的是纯 干→支 映射, 故用 PillarC.changsheng() 反查 —— 仍走 engine 的表。
 */
function zhiByChangsheng(gan: Gan, state: string): Zhi {
  const z = ZHI.find(zhi => PillarC.from(gan, zhi).changsheng() === state)
  if (!z) throw new Error(`unreachable: no ${state} zhi for ${gan}`)
  return z
}

/** 日主禄位（十干禄支）= 十二长生「临官」位。 */
export const LU: Record<Gan, Zhi> = Object.fromEntries(
  GAN.map(g => [g, zhiByChangsheng(g, '临官')]),
) as Record<Gan, Zhi>

/** 日主阳刃位 = 十二长生「帝旺」位。 */
export const YANG_REN: Record<Gan, Zhi> = Object.fromEntries(
  GAN.map(g => [g, zhiByChangsheng(g, '帝旺')]),
) as Record<Gan, Zhi>

// 1.2.0 移除了 GENERATES/CONTROLS/GENERATED_BY/CONTROLLED_BY 四张扁平表,
// 统一由 WUXING_BY_RELATION_TABLE[relation][五行] 查得。
export const WX_GENERATED_BY: Record<string, string> = WUXING_BY_RELATION_TABLE['生我']
export const WX_CONTROLLED_BY: Record<string, string> = WUXING_BY_RELATION_TABLE['克我']
export const WX_CONTROLS: Record<string, string> = WUXING_BY_RELATION_TABLE['我克']

export function yimaFrom(zhi: string): string | undefined {
  try {
    return TRIAD_TABLE_WRAPPER[ZhiC.from(zhi as Zhi).triad().key]['驿马']
  } catch {
    return undefined
  }
}
