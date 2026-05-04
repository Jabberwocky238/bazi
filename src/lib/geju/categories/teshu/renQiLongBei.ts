import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 壬骑龙背 — 日柱壬辰 + 命局无戌 + 配合得当 + 火 / 土 不过度.
 *
 *  bazi-skills 4 条 (《两气成象/水土对/壬骑龙背》):
 *   1. 日柱 === 壬辰                                [静态]
 *   2. 命局无戌 (辰戌冲则破水库)                   [岁运地支戌 → Break]
 *   3. 命局配合: 另一柱壬 / 辰 / 金生 / 木泄          [可被岁运补]
 *   4. 火 / 土 透干 < 2                             [岁运透火 / 土 → 超阈 Break]
 */
export function isRenQiLongBei(): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()

  if (bazi.dayGz !== '壬辰') return null
  const hasXu = bazi.mainArr.some((p) => p.zhi === '戌')
  if (hasXu) return null
  const { year, month, hour } = bazi.pillars
  const baseOtherRen = [year, month, hour].some((p) => p.gan === '壬')
  const baseOtherChen = ([year.zhi, month.zhi, hour.zhi] as string[]).includes('辰')
  const baseJin = bazi.touWx('金') || bazi.rootWx('金')
  const baseMu = bazi.touWx('木')
  const baseStruct3 = baseOtherRen || baseOtherChen || baseJin || baseMu

  // 岁运补: 透壬 / 见辰 / 透金 / 透木
  const extOtherRen = baseOtherRen || extras.extraArr.some((p) => p.gan === '壬')
  const extOtherChen = baseOtherChen || extras.extraArr.some((p) => p.zhi === '辰')
  const extJin = baseJin || extras.extraGanWxCount('金') > 0
  const extMu = baseMu || extras.extraGanWxCount('木') > 0
  const extStruct3 = extOtherRen || extOtherChen || extJin || extMu

  // 火 / 土 透 < 2
  const baseHuoN = bazi.ganWxCount('火')
  const baseTuN = bazi.ganWxCount('土')
  const allHuoN = baseHuoN + extras.extraGanWxCount('火')
  const allTuN = baseTuN + extras.extraGanWxCount('土')
  const baseClean4 = baseHuoN < 2 && baseTuN < 2
  const extClean4 = allHuoN < 2 && allTuN < 2

  // 岁运地支戌冲 → Break
  const extraXu = extras.extraArr.some((p) => p.zhi === '戌')

  const baseFormed = baseStruct3 && baseClean4
  const withExtrasFormed = extStruct3 && extClean4 && !extraXu

  if (!baseFormed && !withExtrasFormed) return null

  return emitGeju(
    {
      name: '壬骑龙背',
      note: `日柱壬辰${baseOtherRen ? '+壬' : ''}${baseOtherChen ? '+辰' : ''}${baseJin ? '+金生' : ''}${baseMu ? '+木泄' : ''}`,
    },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
