import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 身杀两停 — 身旺与七杀势均力敌。
 *
 * bazi-skills 5 条 (《子平真诠·论七杀》《滴天髓·官杀》《滴天髓·体用》):
 *  1. 日主有根有扶, 自成一方之势                  [静态]
 *  2. 七杀透干通根, 成势显威                      [可被岁运补: 岁运透杀]
 *  3. 身与杀的旺度相当 (两停)                     [岁运过偏 → Break]
 *  4. 食神 / 印星 / 羊刃为辅
 *  5. 无严重冲克 / 混杂                           [岁运透正官 → 混杂 Break]
 *
 *  本 detector: 1 静态; 2 base + extras 双路径; 5 base 严判 + 岁运透官 → Break.
 */
export function isShenShaLiangTing(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!strength.shenWang) return null
  if (!bazi.rootExt(bazi.dayWx)) return null

  // —— 条件 2: 七杀透 + 通根 ——
  const baseStruct2 = shishen.tou('七杀') && shishen.zang('七杀')
  const extStruct2 = baseStruct2 || (extras.tou('七杀') && shishen.zang('七杀'))

  // —— 条件 3: 七杀数量 ≥ 3 (主局现状) ——
  const baseStruct3 = shishen.countCat('官杀') >= 3
  // 岁运透杀加量 → 仍可两停 (count + 岁运)
  const extraSha = extras.extraArr.filter(
    (p) => p.shishen === '七杀' || p.hideShishen[0] === '七杀',
  ).length
  const extStruct3 = (shishen.countCat('官杀') + extraSha) >= 3

  // —— 条件 5: 无正官混杂 ——
  const baseClean = !shishen.tou('正官')
  const extClean = baseClean && !extras.tou('正官')

  const baseFormed = baseStruct2 && baseStruct3 && baseClean
  const withExtrasFormed = extStruct2 && extStruct3 && extClean

  return emitGeju(
    { name: '身杀两停', note: '身旺有根 · 七杀透根数≥2 · 官杀不混' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
