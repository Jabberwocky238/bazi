import {
  TRIAD_MAP,
  triadOf,
  GENERATED_BY,
  CONTROLLED_BY,
  CONTROLS,
  type Gan,
  type Zhi,
  type Season,
  type Shishen,
  type ShishenCat,
  type WuXing,
} from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'
import type { StrengthAnalysis, StrengthLevel } from '../strength'

export type { ShishenCat }

// ————————————————————————————————————————————————————————
// 类型
// ————————————————————————————————————————————————————————

export type GejuQuality = 'good' | 'bad' | 'neutral'
export type GejuCategory = '从格' | '十神格' | '五行格' | '专旺格' | '特殊格' | '正格'

export interface GejuHit {
  name: string
  note: string
  /** 是否为岁运（大运/流年）特定触发的判定（默认 undefined 为原局判定）。 */
  suiyunSpecific?: boolean
  /** 原局不成格，**岁运成格**（大运/流年补齐）。 */
  suiyunTrigger?: boolean
  /** 原局成格，**岁运破格**（大运/流年冲散）。 */
  suiyunBreak?: boolean
  // 默认成格
  suiyunDefaultTrigger?: boolean
  // **岁运冲害 */
  suiyunConquer?: boolean
  // 贵格变体
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
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar
  dayun?: Pillar
  liunian?: Pillar
}

/**
 * 格局检测上下文 —— 由 useBazi / useShishen / useStrength 三个 store 状态加上
 * detectGeju 传入的 extras（岁运 + daYunMeta）合并而成。detectGeju 每次调用前
 * 现场拼接，detector 仍以 `(ctx) => GejuHit | null` 形式书写。
 */
export interface Ctx {
  // —— 来自 useBazi ——
  pillars: CtxPillars
  season: Season | ''
  dayYang: boolean
  dayGan: Gan
  dayZhi: Zhi
  dayGz: string
  dayWx: WuXing
  yearZhi: Zhi
  monthZhi: Zhi
  monthCat: ShishenCat | ''
  monthZhiBeingChong: boolean
  mainArr: Pillar[]
  ganSet: Set<Gan>
  ganWxCount: (wx: WuXing) => number
  zhiMainWxCount: (wx: WuXing) => number
  touWx: (wx: WuXing) => boolean
  rootWx: (wx: WuXing) => boolean
  rootExt: (wx: WuXing) => boolean

  // —— 来自 useShishen ——
  ganSs: Shishen[]
  mainZhiArr: string[]
  allZhiArr: Shishen[]
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
  adjacentTou: (s1: Shishen, s2: Shishen) => boolean

  // —— 来自 useStrength ——
  strength: StrengthAnalysis | null
  level: StrengthLevel | ''
  deLing: boolean
  deDi: boolean
  deShi: boolean
  shenWang: boolean
  shenRuo: boolean

  // —— 来自 detectGeju extras ——
  extraArr: Pillar[]
  extraPillars: Pillar[]
  daYunMeta: DaYunMeta | null
  extraGanWxCount: (wx: WuXing) => number
  extraZhiMainWxCount: (wx: WuXing) => number
}

/** Detector 不再接收 ctx 参数, 内部通过 composeCtx() 直接拉 store. */
export type Detector = () => GejuHit | null

// ————————————————————————————————————————————————————————
// 常量（原 lib/geju/ctx.ts 提供）
// SHI_SHEN_CAT / CHONG_PAIR 由 lib/shishen.ts 给出，这里转出，detectors 沿用
// 旧路径 `from '../../types'`。
// ————————————————————————————————————————————————————————

export { SHI_SHEN_CAT, CHONG_PAIR } from '../shared'

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

export function yimaFrom(zhi: string): string | undefined {
  try {
    return TRIAD_MAP[triadOf(zhi as Zhi)]['驿马']
  } catch {
    return undefined
  }
}
