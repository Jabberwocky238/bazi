import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 食神制杀 — 食神紧贴克七杀，身能任。
 *
 * bazi-skills 6 条 (《子平真诠·论七杀》《子平真诠·论食神》《滴天髓·体用》):
 *  1. 月令本气七杀 OR 七杀透干通根             [可被岁运补: 主局缺杀透 + 岁运透杀]
 *  2. 食神透干通根                              [可被岁运补: 岁运透食神]
 *  3. 食杀两停 (食 ≥ 杀 / 2, 食 ≤ 杀 × 2)        [岁运过偏 → Break]
 *  4. 食神与七杀紧贴                            [静态/位置: 不补]
 *  5. 无偏印紧贴克食神 (除非财救)               [岁运透偏印且无财 → Break]
 *  6. 日主非极弱                                [静态]
 *
 *  本 detector: 4、6 静态严判；1、2 用 base + extras 双路径；3 主局两停严判；
 *  5 用 base + 岁运叠加, 岁运透偏印且无财救则 Break。
 */
export function isShiShenZhiSha(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  // —— 条件 6: 静态非极弱 ——
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  // —— 条件 4: 食神与七杀紧贴 (静态严判) ——
  if (!shishen.adjacentTou('食神', '七杀')) return null

  // —— 条件 1: 七杀显 ——
  const monthMainSha = bazi.pillars.month.hideShishen[0] === '七杀'
  const shaTouRoot = shishen.tou('七杀') && shishen.zang('七杀')
  const baseSha = monthMainSha || shaTouRoot
  const extSha = baseSha || (extras.tou('七杀') && shishen.has('七杀'))

  // —— 条件 2: 食神透 + 通根 ——
  const baseShi = shishen.tou('食神') && shishen.zang('食神')
  const extShi = baseShi || (extras.tou('食神') && shishen.has('食神'))

  // —— 条件 3: 食杀两停 (主局严判) ——
  const shiN = shishen.countOf('食神')
  const shaN = shishen.countOf('七杀')
  const baseTwoStop = shaN > 0 && shiN * 2 >= shaN && shaN * 2 >= shiN

  // —— 条件 5: 无枭夺食 (主局 + 岁运) ——
  const baseClean5 = !(
    shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')
  )
  const extClean5 = baseClean5 && !(
    extras.tou('偏印') && !shishen.touCat('财') && !extras.touCat('财')
  )

  const baseFormed = baseSha && baseShi && baseTwoStop && baseClean5
  const withExtrasFormed = extSha && extShi && baseTwoStop && extClean5

  return emitGeju(
    { name: '食神制杀', note: '食杀两停透根紧贴 · 无枭夺食 · 身可任' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
