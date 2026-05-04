/**
 * 合盘单方分析快照 — 直接复用 lib 主算法 (analyzeStrength / analyzeXiyong),
 * 通过 strength 注入避开 useStrength 全局, 拿到完整 XiyongAnalysis.
 *
 * 输出 SideAnalysis 含:
 *   - strength    身强弱完整分析 (得令/得地/得势/总分/级别)
 *   - xiyong      喜用神完整分析 (病根/扶抑/救应/调候/通关/干支作用)
 *   - ganZhi      内部 (本盘 4 柱) 合冲刑害破暗合 等 finding
 *
 *  HepanXiyongMatch 拿 SideAnalysis 双方做匹配评分.
 *  HepanCrossPanel 仍走 lib/hepan/cross 做跨盘.
 */
import { analyzeGanZhi, type GanZhiAnalysis } from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'
import { analyzeStrength, type StrengthAnalysis } from '../strength'
import { analyzeXiyong, type XiyongAnalysis } from '../xiyong'

export interface SideAnalysis {
  pillars: Pillar[]
  strength: StrengthAnalysis
  xiyong: XiyongAnalysis
  /** 本盘内部干支互动 (合冲刑害破暗合 / 墓库 / 盖头截脚覆载). */
  ganZhi: GanZhiAnalysis
}

export function analyzeSide(pillars: Pillar[]): SideAnalysis | null {
  if (pillars.length !== 4) return null
  const strength = analyzeStrength(pillars)
  if (!strength) return null
  const xiyong = analyzeXiyong(pillars, strength)
  if (!xiyong) return null
  const ganZhi = analyzeGanZhi(pillars, [])
  if (!ganZhi) return null
  return { pillars, strength, xiyong, ganZhi }
}

/** @deprecated 用 analyzeSide; 旧调用点过渡用. */
export interface SideXiyong {
  dayGan: XiyongAnalysis['dayGan']
  dayWx: XiyongAnalysis['dayWx']
  level: XiyongAnalysis['level']
  side: XiyongAnalysis['side']
  primaryCat: XiyongAnalysis['primaryCat']
  primaryWx: XiyongAnalysis['primaryWx']
  secondaryCat: XiyongAnalysis['secondaryCat']
  secondaryWx: XiyongAnalysis['secondaryWx']
  avoidCats: XiyongAnalysis['avoidCats']
  avoidWx: XiyongAnalysis['avoidWx']
  reason: XiyongAnalysis['reason']
  tiaohouWx: XiyongAnalysis['tiaohou']['wx']
  tiaohouRequired: XiyongAnalysis['tiaohou']['required']
  tiaohouNote: XiyongAnalysis['tiaohou']['note']
  strength: StrengthAnalysis
}

/** @deprecated 用 analyzeSide. */
export function localXiyong(pillars: Pillar[]): SideXiyong | null {
  const a = analyzeSide(pillars)
  if (!a) return null
  return {
    dayGan: a.xiyong.dayGan,
    dayWx: a.xiyong.dayWx,
    level: a.xiyong.level,
    side: a.xiyong.side,
    primaryCat: a.xiyong.primaryCat,
    primaryWx: a.xiyong.primaryWx,
    secondaryCat: a.xiyong.secondaryCat,
    secondaryWx: a.xiyong.secondaryWx,
    avoidCats: a.xiyong.avoidCats,
    avoidWx: a.xiyong.avoidWx,
    reason: a.xiyong.reason,
    tiaohouWx: a.xiyong.tiaohou.wx,
    tiaohouRequired: a.xiyong.tiaohou.required,
    tiaohouNote: a.xiyong.tiaohou.note,
    strength: a.strength,
  }
}
