import { readBazi, readExtras, readShishen } from '../../hooks'
import { SHI_SHEN_CAT } from '../../types'
import type { ShishenCat } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从X 共用判据 — 与 bazi-skills《格局/从格》对照:
 *
 *  bazi-skills 4 条 (从弱派, 严格版):
 *   1. 天干不透比劫 / 印                         [岁运透比劫/印 → 复根 Break]
 *   2. 地支 (含藏干) 不见比劫 / 印               [静态: 地支无根]
 *   3. 目标类别透干                              [可被岁运补: 岁运透 target → Trigger]
 *   4. 月令属 target (从神当令)                  [静态]
 *
 *  返回 CongResult — 由各子格 detector 喂给 emitGeju 决定:
 *    - 主局成 + 岁运不透比劫印     → 显
 *    - 主局成 + 岁运透比劫 / 印   → 显 + Break (复根破从)
 *    - 主局缺 target 透 + 岁运补  → 隐 + Trigger
 */
export interface CongResult {
  baseFormed: boolean
  withExtrasFormed: boolean
  hasExtras: boolean
  note: string
}

export function checkCong(target: ShishenCat, targetWx: string): CongResult | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()

  // —— 条件 2: 地支不见比劫 / 印 (静态) ——
  if (shishen.allZhiArr.some((s) => SHI_SHEN_CAT[s] === '比劫')) return null
  if (shishen.allZhiArr.some((s) => SHI_SHEN_CAT[s] === '印')) return null

  // —— 条件 4: 月令属 target (静态) ——
  if (bazi.monthCat !== target) return null
  // 地支主气 target 五行 ≥ 1 位
  const zhiSupport = bazi.zhiMainWxCount(targetWx as WuXing)
  if (zhiSupport < 1) return null

  // —— 条件 1: 天干不透比劫 / 印 (主局严判 + 岁运 Break) ——
  const baseClean1 = !shishen.touCat('比劫') && !shishen.touCat('印')
  const extClean1 = baseClean1 && !extras.touCat('比劫') && !extras.touCat('印')

  // —— 条件 3: 目标透干 (主局 / 岁运补) ——
  const baseStruct3 = shishen.touCat(target)
  const extStruct3 = baseStruct3 || extras.touCat(target)

  const baseFormed = baseClean1 && baseStruct3
  const withExtrasFormed = extClean1 && extStruct3

  if (!baseFormed && !withExtrasFormed) return null

  return {
    baseFormed,
    withExtrasFormed,
    hasExtras: extras.active,
    note: `${baseClean1 ? '天干无印比' : '岁运透印比'} · 地支无印比根气 · 月令从${target} · 主气 ${targetWx} ${zhiSupport} 位`,
  }
}
