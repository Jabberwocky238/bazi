/**
 * 日元旺衰量化分析：
 *   - 地支藏干按本气/中气/余气计 10/4/2，并套用年/月/日/时支权重
 *   - 年/月/时天干按 10 分基数计，并套用位置权重
 *   - 月令十二长生额外修正
 *
 * 印星/比劫为 +1，官杀/财星/食伤为 -1；暂不纳入合冲刑害动态修正。
 */

import { create } from 'zustand'
import type { Pillar } from './store'
import {
  CANG_GAN,
  changshengState,
  ganWuxing,
  shishenOf,
  zhiWuxing,
  type Gan,
  type WuXing,
  type Zhi,
} from '@jabberwocky238/bazi-engine'
import { useBazi } from './shishen'

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
  gan: string
  shishen: string
  wuxing: string
  base: number
  direction: 1 | -1
  points: number
}

export interface RootInfo {
  pos: '年' | '月' | '日' | '时'
  zhi: string
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
  gan: string
  shishen: string
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
  dayGan: string
  dayWx: string
  monthZhi: string
  monthWx: string
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
  /** 总分 */
  score: number
  level: StrengthLevel
}

// ————————————————————————————————————————————————————————
// 3. 辅助
// ————————————————————————————————————————————————————————

/** 两个五行的关系 (相对 a)：same=同类，sheng=生a，ke=克a，xie=a生，hao=a克 */
function relation(a: string, b: string): 'same' | 'sheng' | 'ke' | 'xie' | 'hao' {
  if (a === b) return 'same'
  const gen: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  const con: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }
  if (gen[b] === a) return 'sheng'
  if (con[b] === a) return 'ke'
  if (gen[a] === b) return 'xie'
  if (con[a] === b) return 'hao'
  return 'same'
}

function directionOf(dayWx: string, otherWx: string): 1 | -1 {
  const r = relation(dayWx, otherWx)
  return r === 'same' || r === 'sheng' ? 1 : -1
}

function directionLabel(direction: 1 | -1): string {
  return direction > 0 ? '印比生扶' : '官财食伤克泄耗'
}

function analyzeBranch(
  dayGan: Gan,
  dayWx: WuXing,
  zhi: string,
  pos: RootInfo['pos'],
  isZheng: boolean,
): RootInfo {
  const weight = BRANCH_WEIGHTS[pos]
  if (!zhi || !(zhi in CANG_GAN)) {
    return { pos, zhi, kind: 'none', isZheng, label: '未知', rawPoints: 0, weight, points: 0, hidden: [] }
  }

  const hidden = CANG_GAN[zhi as Zhi].map((gan, i) => {
    const wuxing = ganWuxing(gan)
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
  dayGan: Gan,
  dayWx: WuXing,
  gan: string,
  pos: GanContrib['pos'],
): GanContrib | null {
  if (!gan || !(ganWuxing as (g: string) => WuXing | undefined)(gan)) return null
  const g = gan as Gan
  const wx = ganWuxing(g)
  const direction = directionOf(dayWx, wx)
  const weight = STEM_WEIGHTS[pos]
  const points = 10 * direction * weight
  return {
    pos,
    gan,
    shishen: shishenOf(dayGan, g),
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

export function analyzeStrength(pillars: Pillar[]): StrengthAnalysis | null {
  if (pillars.length !== 4) return null
  const [yearP, monthP, dayP, hourP] = pillars
  const dayGan = dayP.gan as Gan
  const dayWx = ganWuxing(dayGan)
  if (!dayWx) return null
  const monthZhi = monthP.zhi as Zhi
  if (!monthZhi) return null
  const monthWx = zhiWuxing(monthZhi)

  const branches: RootInfo[] = [
    analyzeBranch(dayGan, dayWx, yearP.zhi, '年', false),
    analyzeBranch(dayGan, dayWx, monthP.zhi, '月', false),
    analyzeBranch(dayGan, dayWx, dayP.zhi, '日', true),
    analyzeBranch(dayGan, dayWx, hourP.zhi, '时', false),
  ]
  const rootPoints = Number(branches.reduce((s, r) => s + r.points, 0).toFixed(10))

  const ganContribs = [
    analyzeStem(dayGan, dayWx, yearP.gan, '年'),
    analyzeStem(dayGan, dayWx, monthP.gan, '月'),
    analyzeStem(dayGan, dayWx, hourP.gan, '时'),
  ].filter((x): x is GanContrib => !!x)
  const ganPoints = Number(ganContribs.reduce((s, c) => s + c.points, 0).toFixed(10))

  const longState = changshengState(dayGan, monthZhi)
  const correction = LONG_SHENG_POINTS[longState]
  const deLing = correction > 0
  const deLingPoints = correction
  const deLingNote = `月令 ${monthZhi}(${monthWx}) 为日主 ${dayGan}${dayWx} 十二长生「${longState}」`
  const correctionNote = `${longState} ${correction >= 0 ? '+' : ''}${correction}`

  const score = Number((rootPoints + ganPoints + correction).toFixed(10))
  const level = levelOf(score)

  return {
    dayGan, dayWx, monthZhi, monthWx,
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

interface StrengthStore {
  analysis: StrengthAnalysis | null
  level: StrengthLevel | ''
  deLing: boolean
  deDi: boolean
  deShi: boolean
  shenWang: boolean
  shenRuo: boolean
}

function deriveStrength(pillars: Pillar[]): StrengthStore {
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

export const useStrength = create<StrengthStore>()(() => deriveStrength(useBazi.getState().pillars))

useBazi.subscribe((s, prev) => {
  if (s.pillars === prev.pillars) return
  useStrength.setState(deriveStrength(s.pillars))
})
