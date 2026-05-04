/**
 * 日元旺衰分析 —— 严格按 bazi-skills/core/基础/身强弱/ md 评分流程实现：
 *   - 得令 / 得地 / 得生 / 得助 四判据
 *   - 分数累积 → 九级分级
 * 不含人元司令修正（无节气天数数据）与合冲刑害动态修正（md 亦说
 * 评分法仅作参考基线，需人工再审）。
 */

import { create } from 'zustand'
import type { Pillar } from './store'
import { ganWuxing, zhiWuxing } from '@jabberwocky238/bazi-engine'
import { useBazi } from './shishen'

// ————————————————————————————————————————————————————————
// 1. 基础表格（全部来自 md 原文）
// ————————————————————————————————————————————————————————

/**
 * 日主根层级表（推断逻辑.md § 二 2）
 *   key = 日干  value = { 本气根地支, 中气根地支, 余气根地支 }
 */
const ROOT_TABLE: Record<string, { benqi: string[]; zhongqi: string[]; yuqi: string[] }> = {
  甲: { benqi: ['寅', '卯'], zhongqi: ['亥'],             yuqi: [] },
  乙: { benqi: ['寅', '卯'], zhongqi: ['未', '辰'],       yuqi: [] },
  丙: { benqi: ['巳', '午'], zhongqi: ['寅'],             yuqi: [] },
  丁: { benqi: ['巳', '午'], zhongqi: ['戌', '未'],       yuqi: [] },
  戊: { benqi: ['辰', '戌', '丑', '未'], zhongqi: ['巳', '寅', '申'], yuqi: [] },
  己: { benqi: ['辰', '戌', '丑', '未'], zhongqi: [],     yuqi: ['午'] },
  庚: { benqi: ['申', '酉'], zhongqi: ['巳'],             yuqi: [] },
  辛: { benqi: ['申', '酉'], zhongqi: ['丑'],             yuqi: ['戌'] },
  壬: { benqi: ['亥', '子'], zhongqi: ['申'],             yuqi: [] },
  癸: { benqi: ['亥', '子'], zhongqi: ['辰'],             yuqi: ['丑'] },
}

// ————————————————————————————————————————————————————————
// 2. 类型
// ————————————————————————————————————————————————————————

export type RootKind = 'benqi' | 'zhongqi' | 'yuqi' | 'none'

export interface RootInfo {
  pos: '年' | '月' | '日' | '时'
  zhi: string
  kind: RootKind
  isZheng: boolean    // 正根 = 日支坐下
  label: string       // 显示用，如 "本气正根"
  points: number
}

export interface GanContrib {
  pos: '年' | '月' | '时'
  gan: string
  shishen: string
  isSelf: boolean     // 同党 true / 异党 false
  points: number      // +1 / -1
}

export type StrengthLevel =
  | '身极旺' | '身旺' | '身中强' | '身中(偏强)' | '身中(偏弱)'
  | '身略弱' | '身弱' | '身极弱' | '近从弱'

export interface StrengthAnalysis {
  dayGan: string
  dayWx: string
  monthZhi: string
  monthWx: string
  /** 得令：月支主气对日元是生扶 (比劫/印)？ */
  deLing: boolean
  deLingNote: string
  deLingPoints: number
  /** 四柱根 */
  roots: RootInfo[]
  rootPoints: number
  /** 年/月/时 天干贡献 */
  ganContribs: GanContrib[]
  ganPoints: number
  /** 修正：月令印比但日元月令无中气以上根 -1 */
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
  if (gen[b] === a) return 'sheng'       // b 生 a
  if (con[b] === a) return 'ke'          // b 克 a
  if (gen[a] === b) return 'xie'         // a 生 b (泄)
  if (con[a] === b) return 'hao'         // a 克 b (耗)
  return 'same'
}

/** 判断位置 i 对应的根信息 */
function analyzeRoot(
  dayGan: string,
  zhi: string,
  pos: RootInfo['pos'],
  isZheng: boolean,
): RootInfo {
  const t = ROOT_TABLE[dayGan]
  if (!t) {
    return { pos, zhi, kind: 'none', isZheng, label: '无根', points: 0 }
  }
  if (t.benqi.includes(zhi)) {
    return {
      pos, zhi, kind: 'benqi', isZheng,
      label: isZheng ? '本气正根' : '本气旁根',
      points: isZheng ? 3 : 2,
    }
  }
  if (t.zhongqi.includes(zhi)) {
    return {
      pos, zhi, kind: 'zhongqi', isZheng,
      label: isZheng ? '中气正根' : '中气旁根',
      points: isZheng ? 1.5 : 1,
    }
  }
  if (t.yuqi.includes(zhi)) {
    return {
      pos, zhi, kind: 'yuqi', isZheng,
      label: '余气根',
      points: 0.5,
    }
  }
  return { pos, zhi, kind: 'none', isZheng, label: '无根', points: 0 }
}

/** 十神是同党 (比劫/印) 还是异党 */
function isSelfParty(shishen: string): boolean {
  return ['比肩', '劫财', '正印', '偏印'].includes(shishen)
}

// ————————————————————————————————————————————————————————
// 4. 主函数
// ————————————————————————————————————————————————————————

export function analyzeStrength(pillars: Pillar[]): StrengthAnalysis | null {
  if (pillars.length !== 4) return null
  const [yearP, monthP, dayP, hourP] = pillars
  const dayGan = dayP.gan
  const dayWx = ganWuxing(dayGan)
  if (!dayWx) return null
  const monthZhi = monthP.zhi
  const monthWx = zhiWuxing(monthZhi)

  // —— 得令 ——
  // 月支主气对日元: same=比劫, sheng=印  → 得令 +3；否则 -3
  const rel = relation(dayWx, monthWx)
  const deLing = rel === 'same' || rel === 'sheng'
  const deLingPoints = deLing ? 3 : -3
  const deLingNote = deLing
    ? `月令 ${monthZhi}(${monthWx}) ${rel === 'same' ? '同日主(比劫)' : '生日主(印)'}`
    : `月令 ${monthZhi}(${monthWx}) ${
        rel === 'ke' ? '克日主(官杀)' : rel === 'xie' ? '日主生之(食伤)' : '日主克之(财)'
      }`

  // —— 得地 ——
  const roots: RootInfo[] = [
    analyzeRoot(dayGan, yearP.zhi,  '年', false),
    analyzeRoot(dayGan, monthP.zhi, '月', false),
    analyzeRoot(dayGan, dayP.zhi,   '日', true),  // 正根
    analyzeRoot(dayGan, hourP.zhi,  '时', false),
  ]
  const rootPoints = roots.reduce((s, r) => s + r.points, 0)

  // —— 天干得生 / 得助 ——
  const rawGans = [
    { pos: '年' as const, gan: yearP.gan,  shishen: yearP.shishen },
    { pos: '月' as const, gan: monthP.gan, shishen: monthP.shishen },
    { pos: '时' as const, gan: hourP.gan,  shishen: hourP.shishen },
  ]
  const ganContribs: GanContrib[] = rawGans.map((c) => {
    const self = isSelfParty(c.shishen)
    return { ...c, isSelf: self, points: self ? 1 : -1 }
  })
  // 若时柱未知（空），gan 为 '' shishen 为 ''，跳过
  const activeGanContribs = ganContribs.filter((c) => c.gan && c.shishen)
  const ganPoints = activeGanContribs.reduce((s, c) => s + c.points, 0)

  // —— 修正：月令得令但日元月令地支本身无中气以上根 —— -1
  let correction = 0
  let correctionNote = ''
  if (deLing) {
    const monthRoot = roots[1]
    if (monthRoot.kind === 'none' || monthRoot.kind === 'yuqi') {
      correction = -1
      correctionNote = `月令得令但 ${monthZhi} 本身无中气以上根 (-1)`
    }
  }

  const score = deLingPoints + rootPoints + ganPoints + correction
  const level = levelOf(score)

  return {
    dayGan, dayWx, monthZhi, monthWx,
    deLing, deLingNote, deLingPoints,
    roots, rootPoints,
    ganContribs: activeGanContribs,
    ganPoints,
    correction, correctionNote,
    score, level,
  }
}

function levelOf(s: number): StrengthLevel {
  if (s >= 10) return '身极旺'
  if (s >= 7) return '身旺'
  if (s >= 4) return '身中强'
  if (s >= 1) return '身中(偏强)'
  if (s >= -1) return '身中(偏弱)'
  if (s >= -4) return '身略弱'
  if (s >= -7) return '身弱'
  if (s >= -10) return '身极弱'
  return '近从弱'
}

// ————————————————————————————————————————————————————————
// useStrength — 自动跟随 useBazi.pillars 重算 analyzeStrength；同时把
// level / deLing / deDi / deShi / shenWang / shenRuo 这几个常用判定扁平
// 到 store 顶层，避免到处 .analysis?.X 或挂在 ctx 上。
// ————————————————————————————————————————————————————————

const STRONG_LV = new Set<StrengthLevel>(['身极旺', '身旺', '身中强', '身中(偏强)'])
const WEAK_LV = new Set<StrengthLevel>(['身略弱', '身弱', '身极弱', '近从弱', '身中(偏弱)'])

interface StrengthDerived {
  analysis: StrengthAnalysis | null
  level: StrengthLevel | ''
  deLing: boolean
  deDi: boolean
  deShi: boolean
  shenWang: boolean
  shenRuo: boolean
}

function deriveStrength(pillars: Pillar[]): StrengthDerived {
  const analysis = analyzeStrength(pillars)
  if (!analysis) {
    return {
      analysis: null,
      level: '',
      deLing: false,
      deDi: false,
      deShi: false,
      shenWang: false,
      shenRuo: false,
    }
  }
  return {
    analysis,
    level: analysis.level,
    deLing: analysis.deLing,
    deDi: analysis.roots[2].kind !== 'none',
    deShi: analysis.ganPoints > 0,
    shenWang: STRONG_LV.has(analysis.level),
    shenRuo: WEAK_LV.has(analysis.level),
  }
}

export const useStrength = create<StrengthDerived>()(() =>
  deriveStrength(useBazi.getState().pillars),
)

useBazi.subscribe((s, prev) => {
  if (s.pillars === prev.pillars) return
  useStrength.setState(deriveStrength(s.pillars))
})
