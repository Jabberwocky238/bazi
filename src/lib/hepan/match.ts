/**
 * 合盘 - 喜用神匹配 + 干支互动综合打分.
 *
 *  双方各算 SideXiyong, 然后:
 *    aPrimaryFromB = B 给 A 提供"用神五行" 多少位 (干 + 地支本气)
 *    bPrimaryFromA = A 给 B 提供"用神五行" 多少位
 *    aAvoidFromB   = B 带给 A 多少 "忌神五行"
 *    aTiaohouFromB = (若 A 调候硬约束) B 提供调候五行多少位
 *
 *  另注入跨盘干支 finding 总数 (合 / 冲 / 刑害破 / 克), 同样参与打分:
 *    合 +3 (合多缘深) · 冲 -4 (摩擦) · 刑害破 -2 (暗耗) · 克 -3 (单向压制)
 *
 *  scoreMatch 综合上述指标输出 0-100 的合度分.
 */
import { ganWuxing, zhiWuxing, type WuXing } from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'
import type { XiyongAnalysis } from '../xiyong'
import { analyzeHepanCross } from './cross'

/**
 * 统计某 Pillar[] 中天干 + 地支本气 中各五行的出现位数 (不含藏中/余气).
 */
export function wxDistribution(pillars: Pillar[]): Record<WuXing, number> {
  const cnt: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  for (const p of pillars) {
    const gw = ganWuxing(p.gan) as WuXing | undefined
    if (gw) cnt[gw] += 1
    const zw = zhiWuxing(p.zhi) as WuXing | undefined
    if (zw) cnt[zw] += 1
  }
  return cnt
}

/** 一方对另一方"贡献"指定五行的位数 (干 + 地支本气). */
export function wxSupply(provider: Pillar[], target: WuXing): number {
  return wxDistribution(provider)[target] ?? 0
}

/** 双向用神供给 / 调候补足 / 忌神冲撞 + 跨盘干支 finding 数据. */
export interface XiyongMatch {
  /** A 喜用 B 提供位数 */
  aPrimaryFromB: number
  aSecondaryFromB: number
  bPrimaryFromA: number
  bSecondaryFromA: number
  /** A 忌神 B 提供位数 (>0 即有损) */
  aAvoidFromB: number
  bAvoidFromA: number
  /** A 调候用神 B 提供位数 (仅 A 调候硬约束才有意义) */
  aTiaohouFromB: number
  bTiaohouFromA: number
  /** 跨盘干支 finding 总数 (合冲刑害破暗合克均对称, 用单向 count 即可). */
  crossHe: number
  crossChong: number
  crossXinghaipo: number
  crossKe: number
}

export function computeXiyongMatch(
  aPillars: Pillar[], aXy: XiyongAnalysis | null, aName: string,
  bPillars: Pillar[], bXy: XiyongAnalysis | null, bName: string,
): XiyongMatch {
  const safeSupply = (provider: Pillar[], wx: WuXing | null) =>
    wx ? wxSupply(provider, wx) : 0
  const sumAvoid = (provider: Pillar[], wxs: WuXing[]) =>
    wxs.reduce((s, w) => s + wxSupply(provider, w), 0)

  // 跨盘干支 finding (单向, 合冲刑害破对称, 不需双向去重)
  const cross = analyzeHepanCross(aPillars, bPillars, bName, aName)
  const all = cross?.all

  return {
    aPrimaryFromB:   safeSupply(bPillars, aXy?.primaryWx ?? null),
    aSecondaryFromB: safeSupply(bPillars, aXy?.secondaryWx ?? null),
    bPrimaryFromA:   safeSupply(aPillars, bXy?.primaryWx ?? null),
    bSecondaryFromA: safeSupply(aPillars, bXy?.secondaryWx ?? null),
    aAvoidFromB:     sumAvoid(bPillars, aXy?.avoidWx ?? []),
    bAvoidFromA:     sumAvoid(aPillars, bXy?.avoidWx ?? []),
    aTiaohouFromB:   aXy?.tiaohou.required ? safeSupply(bPillars, aXy.tiaohou.wx) : 0,
    bTiaohouFromA:   bXy?.tiaohou.required ? safeSupply(aPillars, bXy.tiaohou.wx) : 0,
    crossHe:        all?.he.length ?? 0,
    crossChong:     all?.chong.length ?? 0,
    crossXinghaipo: all?.xinghaipo.length ?? 0,
    crossKe:        all?.ke.length ?? 0,
  }
}

/**
 * 综合评分 — 两边各自给出 0-100 的"对方对自己的喜用程度":
 *   a = B 对 A 的 喜用程度 (B 给 A 供用神 + 调候 - A 忌神 + 跨盘合冲)
 *   b = A 对 B 的 喜用程度 (反向)
 *
 *  公式 (单边):
 *   50 (基线)
 *   + 主用神 ×12 + 喜神 ×6        (对方提供我所需)
 *   + 调候 ×8                     (对方提供我硬约束)
 *   - 忌神 ×4                     (对方带来我忌讳)
 *   + 跨盘合 ×3 - 冲 ×4 - 刑害破 ×2 - 克 ×3   (干支互动, 双方共享)
 *   clamp(0, 100)
 */
export interface MatchScore {
  /** B 对 A 的 喜用程度. */
  a: number
  /** A 对 B 的 喜用程度. */
  b: number
}

export function scoreMatch(m: XiyongMatch): MatchScore {
  const ganZhi = m.crossHe * 3 - m.crossChong * 4 - m.crossXinghaipo * 2 - m.crossKe * 3
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)))
  const a = clamp(
    50 + m.aPrimaryFromB * 12 + m.aSecondaryFromB * 6
       + m.aTiaohouFromB * 8 - m.aAvoidFromB * 4 + ganZhi,
  )
  const b = clamp(
    50 + m.bPrimaryFromA * 12 + m.bSecondaryFromA * 6
       + m.bTiaohouFromA * 8 - m.bAvoidFromA * 4 + ganZhi,
  )
  return { a, b }
}
