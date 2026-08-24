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
  ganWangShuai,
  shishenOf,
  GanC,
  WuXingC,
  ZhiC,
  type ShishenC,
  type WangShuai,
} from '@jabberwocky238/bazi-engine'

const HIDDEN_STEM_STRENGTH = [10, 4, 2] as const
const BRANCH_WEIGHTS = { 年: 0.8, 月: 1.5, 日: 1.2, 时: 1.0 } as const
const STEM_WEIGHTS = { 年: 0.8, 月: 1.0, 时: 1.0 } as const

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
   * 日主在月令下的旺相休囚死 (engine ganWangShuai) —— 粗判, 与评分法独立。
   * 旺 > 相 > 休 > 囚 > 死。
   */
  wangShuai: WangShuai
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

export function analyzeStrength(pillars: DetailedPillar[]): StrengthAnalysis | null {
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

  // 1.2.0: changshengState 收进 PillarC.changsheng()
  const longState = PillarC.from(dayGan, monthZhi).changsheng()
  const correction = LONG_SHENG_POINTS[longState]
  const deLing = correction > 0
  const deLingPoints = correction
  const deLingNote = `月令 ${monthZhi.str}(${monthWx.str}) 为日主 ${dayGan.str}${dayWx.str} 十二长生「${longState}」`
  const correctionNote = `${longState} ${correction >= 0 ? '+' : ''}${correction}`

  const score = Number((rootPoints + ganPoints + correction).toFixed(10))
  const level = levelOf(score)
  const wangShuai = ganWangShuai(dayGan, monthZhi)

  return {
    dayGan, dayWx, monthZhi, monthWx, wangShuai,
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
export function deriveStrength(pillars: DetailedPillar[]): StrengthDerived {
  const analysis = analyzeStrength(pillars)
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
