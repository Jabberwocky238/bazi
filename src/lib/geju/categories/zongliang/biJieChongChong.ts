import { readBazi, readExtras, readShishen } from '../../hooks'
import { SHI_SHEN_CAT } from '../../types'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 比劫重重 — 比劫透 ≥ 2 OR 地支主气比劫 ≥ 3 (病象, 需找出口).
 *
 * bazi-skills 4 维度:
 *  1. 比劫强度 (轻 vs 重)                       [可被岁运补: 岁运再透比劫 → Trigger]
 *  2. 食伤是否有效 (路径一: 泄秀)               [由 isShiShangXieXiu 单独判]
 *  3. 官杀是否有效 (路径二: 驾制)               [岁运透官杀 → 出口 Break (病象化解)]
 *  4. 财星是否暴露 (路径三: 夺财)               [由 isJieCaiJianCai 单独判]
 *
 *  本 detector: 仅判维度 1 密度阈值。岁运补比劫 → Trigger; 岁运透官杀 → Break。
 */
export function isBiJieChongChong(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()

  const baseTouN = [shishen.tou('比肩'), shishen.tou('劫财')].filter(Boolean).length +
    (bazi.mainArr.filter((p, i) => i !== 2 && SHI_SHEN_CAT[p.shishen] === '比劫').length > 1 ? 1 : 0)
  const baseZhiN = bazi.mainArr.filter(
    (p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '比劫',
  ).length

  const extraBijieTou = extras.extraArr.filter(
    (p) => SHI_SHEN_CAT[p.shishen] === '比劫',
  ).length
  const extraBijieZhi = extras.extraArr.filter(
    (p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '比劫',
  ).length

  const allTouN = baseTouN + extraBijieTou
  const allZhiN = baseZhiN + extraBijieZhi

  const baseFormed = baseTouN >= 2 || baseZhiN >= 3
  const baseStruct = baseFormed
  const extStruct = allTouN >= 2 || allZhiN >= 3

  if (!baseStruct && !extStruct) return null

  // 岁运透官杀 → 出口已开 → 病象化解 (Break)
  const baseClean = !shishen.touCat('官杀')
  const extClean = baseClean && !extras.touCat('官杀')

  const withExtrasFormed = extStruct && extClean

  return emitGeju(
    {
      name: '比劫重重',
      note: baseFormed
        ? `比劫透 ${baseTouN} 位，地支主气 ${baseZhiN} 位`
        : `主局比劫透 ${baseTouN}+岁运${extraBijieTou}, 主气 ${baseZhiN}+岁运${extraBijieZhi}`,
    },
    { baseFormed: baseStruct && baseClean, withExtrasFormed, hasExtras: extras.active },
  )
}
