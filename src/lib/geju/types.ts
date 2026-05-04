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
  year: Pillar
  month: Pillar
  day: Pillar
  hour: Pillar
  dayun?: Pillar
  liunian?: Pillar
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
