/**
 * 合盘算法层 — 主分析两件事:
 *   ① 喜用神配对 (双方互供用神 / 调候 / 忌神) — xiyong.ts + match.ts
 *   ② 跨盘冲刑合 (合 / 冲 / 刑 / 害 / 破 / 克) — cross.ts (手写 4×4 pair + 三合/三会)
 *
 *  注意: engine.analyzeGanZhi 不输出 self↔extras 的 finding (只输出 self 内部 +
 *   extras 对 self 的 mod), 因此跨盘 finding 由 cross.ts 自行枚举 pair 检测.
 */
export { analyzeSide, localXiyong, type SideAnalysis, type SideXiyong } from './xiyong'
export {
  wxDistribution,
  wxSupply,
  computeXiyongMatch,
  scoreMatch,
  type XiyongMatch,
} from './match'
export {
  analyzeHepanCross,
  analyzeHepanCrossBoth,
  type CrossFindings,
  type ByPillarCross,
  type BidirectionalCross,
  type PillarPos,
  type AnyFinding,
  type FindingKind as CrossFindingKind,
} from './cross'
