import { readBazi, readShishen, readStrength } from '../../hooks'
import { SHI_SHEN_CAT } from '../../types'
import type { GejuHit } from '../../types'
import type { Shishen } from '@jabberwocky238/bazi-engine'

/**
 * 财多身弱 — 实际判据 (与 md 4 条对照)：
 *  ① 身弱 (strength.shenRuo, 近似 md 条件 1 "日主偏弱")。
 *  ② 财透干 ≥ 2 或 财主气 ≥ 2 → 触发 md 条件 2 "财星极旺"。
 *  日主有一丝根 (md 条件 3, 与"从财"分界): 不单独 check, 由 strength 模块的
 *    身弱 / 从弱分级隐式覆盖 — 真极弱无根者会先被划入从弱, 不进本格。
 *  无印化财 / 比劫帮身之足够力 (md 条件 4): 不单独 check, 同样依赖 strength 分级。
 */
export function isCaiDuoShenRuo(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  if (!strength.shenRuo) return null
  const caiTou = (['正财', '偏财'] as Shishen[]).map((s) => shishen.tou(s) ? 1 : 0 as number)
  const touN = (caiTou[0] + caiTou[1])
  const zhiN = bazi.mainArr.filter((p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '财').length
  if (touN < 2 && zhiN < 2) return null
  return { name: '财多身弱', note: `财透 ${touN} 位，地支主气 ${zhiN} 位` }
}
