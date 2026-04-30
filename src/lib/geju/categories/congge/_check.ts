import { readBazi, readShishen } from '../../hooks'
import { SHI_SHEN_CAT } from '../../types'
import type { ShishenCat } from '../../types'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 从X 共用判据 — md 严格版 (从弱派):
 *  ① 天干 不透 比劫 / 印。
 *  ② 地支 (本气 + 中气 + 余气) 一律不见 比劫 / 印 (md 严: 日主无丝毫根气可恃)。
 *  ③ 目标类别透干。
 *  ④ 月令属 target (md 严: 月令为从神当令; "月令非印比"放宽路径删除)。
 */
export function checkCong(target: ShishenCat, targetWx: string): { note: string } | null {
  const bazi = readBazi()
  const shishen = readShishen()
  // ① 天干不透 比劫 / 印
  if (shishen.touCat('比劫')) return null
  if (shishen.touCat('印')) return null
  // ② 地支 (含藏干) 不见 比劫 / 印
  if (shishen.allZhiArr.some((s) => SHI_SHEN_CAT[s] === '比劫')) return null
  if (shishen.allZhiArr.some((s) => SHI_SHEN_CAT[s] === '印')) return null
  // ③ 目标透干
  if (!shishen.touCat(target)) return null
  // ④ 月令必为 target (从神当令)
  if (bazi.monthCat !== target) return null
  // 地支主气 target 五行 ≥ 1 位
  const zhiSupport = bazi.zhiMainWxCount(targetWx as WuXing)
  if (zhiSupport < 1) return null
  return {
    note: `天干无印比 · 地支无印比根气 · 月令从${target} · 主气 ${targetWx} ${zhiSupport} 位`,
  }
}
