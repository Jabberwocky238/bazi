import { readBazi, readExtras, readShishen } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 伤官合杀 — 阴日伤官与七杀双透紧贴，五合去杀。
 *
 * bazi-skills 5 条 (《子平真诠·论伤官》《渊海子平·论合》《滴天髓·合化》):
 *  1. 阴日主 (乙/丁/己/辛/癸 — 伤官与七杀结构上构成五合)  [静态]
 *  2. 伤官与七杀均透干                                       [可被岁运补: 岁运透另一方]
 *  3. 紧贴 (同柱或相邻柱)                                    [静态/位置: 不补]
 *  4. 无争合 (一物可合, 二物不可合)                          [岁运再透同合 → Break]
 *  5. 化神若化非忌神                                         [复杂, 略]
 *
 *  本 detector: 1 静态守卫；3 严判紧贴 (主局两方都透时)；2 用 base + extras
 *  双路径；4 主局严判 + 岁运透同方 → Break。
 */
export function isShangGuanHeSha(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()

  // —— 条件 1: 阴日主 ——
  if (bazi.dayYang) return null

  // —— 条件 3: 紧贴 (主局两方都透时才能严判) ——
  const bothTouMain = shishen.tou('伤官') && shishen.tou('七杀')
  if (bothTouMain && !shishen.adjacentTou('伤官', '七杀')) return null

  // —— 条件 2: 双透 (主局 / 岁运补) ——
  const baseStruct = bothTouMain
  const extStruct = baseStruct
    || (shishen.tou('伤官') && extras.tou('七杀'))
    || (shishen.tou('七杀') && extras.tou('伤官'))

  // —— 条件 4: 无争合 (透 ≤ 1 each, 含岁运) ——
  const shangN = bazi.mainArr.filter((p, i) => i !== 2 && p.shishen === '伤官').length
  const shaN = bazi.mainArr.filter((p, i) => i !== 2 && p.shishen === '七杀').length
  const baseClean = shangN <= 1 && shaN <= 1
  const extraShang = extras.extraArr.filter((p) => p.shishen === '伤官').length
  const extraSha = extras.extraArr.filter((p) => p.shishen === '七杀').length
  const extClean = baseClean && (shangN + extraShang) <= 1 && (shaN + extraSha) <= 1

  const baseFormed = baseStruct && baseClean
  const withExtrasFormed = extStruct && extClean

  return emitGeju(
    { name: '伤官合杀', note: `阴日主 ${bazi.dayGan} 伤官七杀紧贴双透五合，无争合` },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
