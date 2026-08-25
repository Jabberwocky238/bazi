import type {
  PillarType,
  Gan,
  Zhi,
  WuXing,
  Season,
  Sex,
  BaziInput,
  DetailedPillar,
  ChangSheng,
} from '@jabberwocky238/bazi-engine'
import {
  GanC,
  ZhiC,
  WuXingC,
  PillarC,
  BaziInputC,
  ShishenC,
  ShishenCC,
  shishenOf,
  shishenWuxing as engineShishenWuxing,
  Calculator,
  pairwiseZhi,
  GAN,
  ZHI,
  type Shishen,
  type ShishenCat,
} from '@jabberwocky238/bazi-engine'

export type { Gan, Zhi, WuXing, Shishen, ShishenCat, Season, PillarType, BaziInput, Sex }
export type { DetailedPillar, ChangSheng }
export { GanC, ZhiC, WuXingC, PillarC, BaziInputC, ShishenC, ShishenCC }

/** 一柱即 engine 的 DetailedPillar (干支收在 .pillar: PillarC 下)。 */
export type Pillar = DetailedPillar

// ————————————————————————————————————————————————————————
// 柱访问器 —— engine 1.2.0 把干支收进 p.pillar (PillarC),
// 这几个 helper 让调用方不必到处写 p.pillar.gan / p.pillar.zhi。
// ————————————————————————————————————————————————————————

/** 柱天干。 */
export function pGan(p: DetailedPillar): GanC { return p.pillar.gan }
/** 柱地支。 */
export function pZhi(p: DetailedPillar): ZhiC { return p.pillar.zhi }
/** 柱位标签 (年柱/月柱/日柱/时柱; 岁运柱为其自身标签)。 */
export function pLabel(p: DetailedPillar): string { return p.pillar.pillarType ?? '' }
/** 柱纳音名。 */
export function pNayin(p: DetailedPillar): string { return p.pillar.nayinName() }

/** 兼容旧代码的 BaziDerived 名称，实际就是 BaziResult */
export type BaziDerived = BaziResult

/**
 * 一柱的十神视图 —— engine 的 DetailedPillar 不再挂十神, 由 Calculator.shishen()
 * 统一提供; 这里按柱位把结果摊平, 供 UI 与算法层按 index 取用。
 */
export interface PillarShishenView {
  /** 天干十神; 日柱为 null (日主自身不论十神)。 */
  gan: ShishenC | null
  /** 地支藏干各自的十神 (与 zhi.canggan() 同序)。 */
  zhi: ShishenC[]
}

export type BaziResult = {
  // 基础信息
  solarStr: string
  trueSolarStr: string
  lunarStr: string
  pillars: DetailedPillar[]
  hourKnown: boolean
  /** 四柱十神 (与 pillars 同序同长)。 */
  shishen: PillarShishenView[]
  /**
   * 出生日距本月节令起点的天数 (节令当日记 1) —— 人元司令用。
   * 八字直输无公历日期, 故为 undefined。
   */
  dayInMonth?: number

  // BaziDerived 合并字段
  dayGan: GanC | null
  dayZhi: ZhiC | null
  dayGz: string
  dayWx: WuXingC | null
  dayYang: boolean
  yearZhi: ZhiC | null
  monthZhi: ZhiC | null
  season: Season | ''
  monthCat: ShishenCC | null
  monthZhiBeingChong: boolean
  mainArr: DetailedPillar[]
  ganSet: Set<Gan>
}

/** 时辰未知占位 (BaziInputState.hour 取这个值即代表"时柱未知")。 */
export const HOUR_UNKNOWN = -1

/**
 * 地支六冲对 —— 由 engine 的 pairwiseZhi 反查生成, 不再手维表。
 * 六冲即 相冲, 十二支两两扫一遍即得。
 */
export const CHONG_PAIR: Record<string, string> = Object.fromEntries(
  ZHI.flatMap((a) =>
    ZHI.map((b) => (pairwiseZhi(a, b)?.kind === '相冲' ? [a, b] : null))
      .filter((x): x is [Zhi, Zhi] => !!x),
  ),
)

/** 阳干判定 —— 十干序偶数即阳 (甲/丙/戊/庚/壬), 用 engine 的 GanC.index。 */
export const YANG_GANS: ReadonlySet<string> = new Set(
  GAN.filter((g) => GanC.from(g).index % 2 === 0),
)

/** 十神 → 类别映射 (由 engine ShishenC.catMap 派生)。 */
export const SHI_SHEN_CAT: Record<Shishen | string, ShishenCat> = { ...ShishenC.catMap }

/**
 * 十神五行 (依日主)。日主本位/空串/未识别十神统一回 null。
 */
export function shishenWuxing(dayGan: GanC, shishen: ShishenC | '日主'): WuXingC | null {
  if (shishen === '日主') return dayGan.wuxing
  return engineShishenWuxing(dayGan, shishen)
}

/** 一柱是否为有效柱 (时辰未知时时柱缺省)。 */
export function hasPillar(p: DetailedPillar | undefined): p is DetailedPillar {
  return !!p
}

/** 空排盘结果占位 */
export const EMPTY_RESULT: BaziResult = {
  solarStr: '',
  trueSolarStr: '',
  lunarStr: '',
  pillars: [],
  hourKnown: false,
  shishen: [],
  dayGan: null,
  dayZhi: null,
  dayGz: '',
  dayWx: null,
  dayYang: false,
  yearZhi: null,
  monthZhi: null,
  season: '',
  monthCat: null,
  monthZhiBeingChong: false,
  mainArr: [],
  ganSet: new Set(),
}

/**
 * 计算四柱十神视图。日柱天干十神记 null。
 */
export function computeShishenView(pillars: DetailedPillar[]): PillarShishenView[] {
  const dayGan = pillars[2] && pGan(pillars[2])
  if (!dayGan) return pillars.map(() => ({ gan: null, zhi: [] }))
  return pillars.map((p) => ({
    gan: p.isRizhu ? null : shishenOf(dayGan, pGan(p)),
    zhi: pZhi(p).canggan().map((g) => shishenOf(dayGan, g)),
  }))
}

/** 填充派生字段到 BaziResult。pillars 保持 engine 原样 (XxxC 值对象)。 */
export function fillDerivedFields(result: {
  solarStr: string
  trueSolarStr: string
  lunarStr: string
  pillars: DetailedPillar[]
  hourKnown: boolean
  dayInMonth?: number
}): BaziResult {
  const { pillars } = result
  const [yearPillar, monthPillar, dayPillar] = pillars

  const dayGan = dayPillar ? pGan(dayPillar) : null
  const dayZhi = dayPillar ? pZhi(dayPillar) : null
  const dayGz = dayGan && dayZhi ? `${dayGan.str}${dayZhi.str}` : ''
  const dayWx = dayGan?.wuxing ?? null
  const dayYang = dayGan ? YANG_GANS.has(dayGan.str) : false
  const yearZhi = yearPillar ? pZhi(yearPillar) : null
  const monthZhi = monthPillar ? pZhi(monthPillar) : null
  const season: Season | '' = monthZhi ? monthZhi.season().season : ''

  const shishen = computeShishenView(pillars)
  const monthCat = shishen[1]?.gan?.cat ?? null
  const monthZhiBeingChong = !!monthZhi && CHONG_PAIR[monthZhi.str] === (dayZhi?.str ?? '')
  const ganSet = new Set(pillars.map((p) => pGan(p).str))

  return {
    ...result,
    pillars,
    shishen,
    dayGan,
    dayZhi,
    dayGz,
    dayWx,
    dayYang,
    yearZhi,
    monthZhi,
    season,
    monthCat,
    monthZhiBeingChong,
    mainArr: pillars.slice(),
    ganSet,
  }
}

export { Calculator }
