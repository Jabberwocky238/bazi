/**
 * 公历 → 八字 与 干支 → 八字 的计算逻辑。
 * 所有核心计算逻辑已迁移到 @/lib，本文件作为 stores 层的适配器。
 */
import {
  computeBazi,
  computeFromState as libComputeFromState,
  parseBaziToResult,
  equationOfTime,
  type BaziResult,
  type BaziInputData,
  type ComputedFromState,
  type BaziInputMode,
} from '@LIB'
import { type Sex } from '@jabberwocky238/bazi-engine'

// 重新导出 lib 中的函数，保持 stores 层接口不变
export {
  computeBazi,
  equationOfTime,
  type BaziResult,
  type BaziInputData,
  type ComputedFromState,
  type BaziInputMode,
  type Sex,
}

/**
 * stores 层 computeFromState — 直接委托给 lib/compute.ts 实现。
 * 保持此函数是为了向后兼容现有调用方。
 */
export function computeFromState(s: BaziInputData): ComputedFromState | null {
  return libComputeFromState(s)
}

/**
 * 解析八字字符串 → Pillar[]
 * 兼容旧代码调用。
 */
export function parseBaziPillars(bazi: [string, string, string, string], sex: Sex): BaziResult {
  return parseBaziToResult(bazi, sex)
}
