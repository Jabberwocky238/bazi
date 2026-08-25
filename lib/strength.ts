/**
 * 日元旺衰量化分析：
 *   - 地支藏干按本气/中气/余气计 10/4/2，并套用年/月/日/时支权重
 *   - 年/月/时天干按 10 分基数计，并套用位置权重
 *   - 月令十二长生额外修正
 *
 * 印星/比劫为 +1，官杀/财星/食伤为 -1；暂不纳入合冲刑害动态修正。
 */

import type { DetailedPillar } from './base'
import {
  PillarC,
  SiLingC,
  ganWangShuai,
  shishenOf,
  GanC,
  WuXingC,
  ZhiC,
  type ShishenC,
  type SiLingSpan,
  type WangShuai,
} from '@jabberwocky238/bazi-engine'

const HIDDEN_STEM_STRENGTH = [10, 4, 2] as const
const BRANCH_WEIGHTS = { 年: 0.8, 月: 1.5, 日: 1.2, 时: 1.0 } as const
const STEM_WEIGHTS = { 年: 0.8, 月: 1.0, 时: 1.0 } as const

/**
 * 司令旺衰 → 修正分。与十二长生同量级:
 *   旺 ≈ 帝旺/临官, 相 ≈ 长生, 休 ≈ 衰, 囚 ≈ 病/死, 死 ≈ 绝。
 */
const WANG_SHUAI_POINTS: Record<WangShuai, number> = {
  旺: 22,
  相: 12,
  休: 0,
  囚: -10,
  死: -20,
}

const LONG_SHENG_POINTS = {
  临官: 20,
  帝旺: 25,
  长生: 15,
  冠带: 10,
  沐浴: 5,
  衰: 0,
  病: -5,
  死: -10,
  墓: -5,
  绝: -20,
  胎: -10,
  养: -5,
} as const

type LongShengState = keyof typeof LONG_SHENG_POINTS

// ————————————————————————————————————————————————————————
// 2. 类型
// ————————————————————————————————————————————————————————

export type RootKind = 'positive' | 'negative' | 'neutral' | 'none'

export interface HiddenStemContrib {
  gan: GanC
  shishen: ShishenC
  wuxing: WuXingC
  base: number
  direction: 1 | -1
  points: number
}

export interface RootInfo {
  pos: '年' | '月' | '日' | '时'
  zhi: ZhiC
  kind: RootKind
  isZheng: boolean
  label: string
  rawPoints: number
  weight: number
  points: number
  hidden: HiddenStemContrib[]
}

export interface GanContrib {
  pos: '年' | '月' | '时'
  gan: GanC
  shishen: ShishenC
  isSelf: boolean
  base: number
  weight: number
  direction: 1 | -1
  points: number
}

/** 人元司令展示信息。 */
export interface SiLingInfo {
  /** 当日主事的藏干。 */
  gan: string
  /** 所处段: 余气 / 中气 / 本气。 */
  phase: string
  /** 入本月节令后的天数, 节令当日记 1。 */
  dayInMonth: number
  /** 本月令完整分野, 供展示。 */
  spans: readonly SiLingSpan[]
  /** 是否本气当令。 */
  isBenQi: boolean
  /** 日主以司令干为准的旺衰。 */
  wangShuaiOfDay: WangShuai
}

export type StrengthLevel =
  | '身极旺' | '身旺' | '身中强' | '身中(偏强)' | '身中(偏弱)'
  | '身略弱' | '身弱' | '身极弱' | '近从弱'

export interface StrengthAnalysis {
  dayGan: GanC
  dayWx: WuXingC
  monthZhi: ZhiC
  monthWx: WuXingC
  /** 得令：月令十二长生修正为正值。 */
  deLing: boolean
  deLingNote: string
  deLingPoints: number
  /** 四柱地支藏干加权贡献。 */
  roots: RootInfo[]
  rootPoints: number
  /** 年/月/时 天干贡献。 */
  ganContribs: GanContrib[]
  ganPoints: number
  /** 月令十二长生修正。 */
  correction: number
  correctionNote: string
  /**
   * 日主在月令下的旺相休囚死 (engine ganWangShuai) —— 粗判。
   * 旺 > 相 > 休 > 囚 > 死。注意这是按月令**本气**判的,
   * 与 siLing.wangShuaiOfDay (按司令干判) 可能相反。
   */
  wangShuai: WangShuai
  /**
   * 人元司令 —— 月令藏干按 余气→中气→本气 轮流当令。
   * 需要出生日距本月节令的天数才能定, 故仅在有公历日期时可得 (八字直输为 null)。
   * 有司令时, 十二长生修正按司令干所居之位计 (取代月支本气)。
   */
  siLing: SiLingInfo | null
  /** 总分 */
  score: number
  level: StrengthLevel
}

// ————————————————————————————————————————————————————————
// 3. 辅助
// ————————————————————————————————————————————————————————

/** 生扶 (+1) / 克泄耗 (-1)：同类与生我为生扶，其余为克泄耗。 */
function directionOf(dayWx: WuXingC, otherWx: WuXingC): 1 | -1 {
  const r = dayWx.relationOf(otherWx)
  return r === '同类' || r === '生我' ? 1 : -1
}

function directionLabel(direction: 1 | -1): string {
  return direction > 0 ? '印比生扶' : '官财食伤克泄耗'
}

function analyzeBranch(
  dayGan: GanC,
  dayWx: WuXingC,
  zhi: ZhiC,
  pos: RootInfo['pos'],
  isZheng: boolean,
): RootInfo {
  const weight = BRANCH_WEIGHTS[pos]

  const hidden = zhi.canggan().map((gan, i) => {
    const wuxing = gan.wuxing
    const direction = directionOf(dayWx, wuxing)
    const base = HIDDEN_STEM_STRENGTH[i] ?? 0
    return {
      gan,
      shishen: shishenOf(dayGan, gan),
      wuxing,
      base,
      direction,
      points: base * direction,
    }
  })
  const rawPoints = hidden.reduce((s, h) => s + h.points, 0)
  const points = Number((rawPoints * weight).toFixed(10))
  const kind: RootKind = points > 0 ? 'positive' : points < 0 ? 'negative' : 'neutral'
  const label = `${directionLabel(points >= 0 ? 1 : -1)} ${rawPoints >= 0 ? '+' : ''}${rawPoints} × ${weight}`
  return { pos, zhi, kind, isZheng, label, rawPoints, weight, points, hidden }
}

function analyzeStem(
  dayGan: GanC,
  dayWx: WuXingC,
  gan: GanC,
  pos: GanContrib['pos'],
): GanContrib {
  const wx = gan.wuxing
  const direction = directionOf(dayWx, wx)
  const weight = STEM_WEIGHTS[pos]
  const points = 10 * direction * weight
  return {
    pos,
    gan,
    shishen: shishenOf(dayGan, gan),
    isSelf: direction > 0,
    base: 10,
    weight,
    direction,
    points,
  }
}

// ————————————————————————————————————————————————————————
// 4. 主函数
// ————————————————————————————————————————————————————————

/**
 * @param dayInMonth 出生日距本月节令起点的天数 (节令当日记 1)。
 *   给了就按**人元司令**定十二长生修正位; 不给则退回月支本气 (八字直输无日期)。
 */
export function analyzeStrength(
  pillars: DetailedPillar[],
  dayInMonth?: number,
): StrengthAnalysis | null {
  if (pillars.length !== 4) return null
  const [yearP, monthP, dayP, hourP] = pillars
  const dayGan = dayP.pillar.gan
  const dayWx = dayGan.wuxing
  const monthZhi = monthP.pillar.zhi
  const monthWx = monthZhi.wuxing

  const branches: RootInfo[] = [
    analyzeBranch(dayGan, dayWx, yearP.pillar.zhi, '年', false),
    analyzeBranch(dayGan, dayWx, monthP.pillar.zhi, '月', false),
    analyzeBranch(dayGan, dayWx, dayP.pillar.zhi, '日', true),
    analyzeBranch(dayGan, dayWx, hourP.pillar.zhi, '时', false),
  ]
  const rootPoints = Number(branches.reduce((s, r) => s + r.points, 0).toFixed(10))

  const ganContribs = [
    analyzeStem(dayGan, dayWx, yearP.pillar.gan, '年'),
    analyzeStem(dayGan, dayWx, monthP.pillar.gan, '月'),
    analyzeStem(dayGan, dayWx, hourP.pillar.gan, '时'),
  ]
  const ganPoints = Number(ganContribs.reduce((s, c) => s + c.points, 0).toFixed(10))

  // 人元司令 —— 有出生日才能定当日主事藏干。
  //   md: 「司令是确定天干旺衰最权威的依据」「司令一错, 整个旺衰、喜用判断全盘错」。
  //   司令是 日主五行 vs 司令干五行 的旺相休囚死 (不涉及地支),
  //   故走 WANG_SHUAI_POINTS, 而非把司令干换算成某个地支再取十二长生。
  const sl = dayInMonth !== undefined ? SiLingC.from(monthZhi, dayInMonth) : null
  const siLing: SiLingInfo | null = sl
    ? {
        gan: sl.gan.str,
        phase: sl.phase,
        dayInMonth: sl.dayInMonth,
        spans: sl.spans,
        isBenQi: sl.isBenQi,
        wangShuaiOfDay: sl.wangShuaiOfGan(dayGan),
      }
    : null

  // 月令修正: 有司令按司令干的旺相休囚死计, 否则退回月支十二长生。
  const longState = PillarC.from(dayGan, monthZhi).changsheng()
  const correction = siLing
    ? WANG_SHUAI_POINTS[siLing.wangShuaiOfDay]
    : LONG_SHENG_POINTS[longState]
  const deLing = correction > 0
  const deLingPoints = correction
  const deLingNote = siLing
    ? `司令 ${siLing.gan}${siLing.phase}用事 (${monthZhi.str}月第${siLing.dayInMonth}天) → 日主 ${dayGan.str}${dayWx.str} 「${siLing.wangShuaiOfDay}」`
    : `月令 ${monthZhi.str}(${monthWx.str}) 为日主 ${dayGan.str}${dayWx.str} 十二长生「${longState}」`
  const correctionNote = siLing
    ? `${siLing.wangShuaiOfDay} ${correction >= 0 ? '+' : ''}${correction}`
    : `${longState} ${correction >= 0 ? '+' : ''}${correction}`

  const score = Number((rootPoints + ganPoints + correction).toFixed(10))
  const level = levelOf(score)
  const wangShuai = ganWangShuai(dayGan, monthZhi)

  return {
    dayGan, dayWx, monthZhi, monthWx, wangShuai, siLing,
    deLing, deLingNote, deLingPoints,
    roots: branches, rootPoints,
    ganContribs, ganPoints,
    correction, correctionNote,
    score, level,
  }
}

function levelOf(s: number): StrengthLevel {
  if (s >= 60) return '身极旺'
  if (s >= 30) return '身旺'
  if (s >= 15) return '身中强'
  if (s >= 0) return '身中(偏强)'
  if (s > -15) return '身中(偏弱)'
  if (s > -30) return '身略弱'
  if (s >= -60) return '身弱'
  if (s >= -90) return '身极弱'
  return '近从弱'
}

export interface StrengthDerived {
  analysis: StrengthAnalysis | null
  level: StrengthLevel | ''
  deLing: boolean
  deDi: boolean
  deShi: boolean
  shenWang: boolean
  shenRuo: boolean
}

/** 身强弱派生计算（含得令/得地/得势/身旺/身弱判定）。 */
export function deriveStrength(
  pillars: DetailedPillar[],
  dayInMonth?: number,
): StrengthDerived {
  const analysis = analyzeStrength(pillars, dayInMonth)
  const rootPoints = analysis?.rootPoints ?? 0
  const ganPoints = analysis?.ganPoints ?? 0
  const score = analysis?.score ?? 0
  return {
    analysis,
    level: analysis?.level ?? '',
    deLing: analysis?.deLing ?? false,
    deDi: rootPoints > 0,
    deShi: ganPoints > 0,
    shenWang: !!analysis && score >= 30,
    shenRuo: !!analysis && score <= -30,
  }
}
