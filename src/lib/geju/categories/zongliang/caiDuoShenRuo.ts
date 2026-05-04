import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import { SHI_SHEN_CAT } from '../../types'
import type { GejuHit } from '../../types'
import type { Shishen } from '@jabberwocky238/bazi-engine'
import { emitGeju } from '../../_emit'

/**
 * 财多身弱 (病象) — 日主偏弱 + 财星极旺.
 *
 * bazi-skills 4 条 (《滴天髓》《子平真诠·论财》):
 *  1. 日主偏弱                                    [静态 - 由 strength 决定]
 *  2. 财星极旺 (透 ≥ 2 或 主气 ≥ 2)               [可被岁运补: 岁运透财 → Trigger]
 *  3. 日主仍有一丝根 (与"从财"分界)               [由 strength 隐式覆盖]
 *  4. 无印化财 / 比劫帮身之足够力                 [岁运透印 / 比劫 → Break (救应)]
 *
 *  本 detector: 1 静态; 2 base + extras 双路径; 4 base 严判 + 岁运 Break.
 */
export function isCaiDuoShenRuo(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  // —— 条件 1: 静态身弱 ——
  if (!strength.shenRuo) return null

  // —— 条件 2: 财极旺 (透 ≥ 2 或 主气 ≥ 2) ——
  const caiTouArr = (['正财', '偏财'] as Shishen[]).map((s) => shishen.tou(s) ? 1 : 0)
  const baseTouN = caiTouArr[0] + caiTouArr[1]
  const baseZhiN = bazi.mainArr.filter(
    (p) => SHI_SHEN_CAT[p.hideShishen[0] ?? ''] === '财',
  ).length
  const extraCaiTou = extras.extraArr.filter(
    (p) => p.shishen === '正财' || p.shishen === '偏财',
  ).length
  const extraCaiZhi = extras.extraArr.filter(
    (p) => p.hideShishen[0] === '正财' || p.hideShishen[0] === '偏财',
  ).length
  const baseStruct2 = baseTouN >= 2 || baseZhiN >= 2
  const extStruct2 = (baseTouN + extraCaiTou) >= 2 || (baseZhiN + extraCaiZhi) >= 2

  if (!baseStruct2 && !extStruct2) return null

  // —— 条件 4: 主局无足量印 / 比劫救身 ≈ shenRuo 已隐式判;
  //   岁运透印 / 比劫 → 视为救应 → Break ——
  const extClean = !extras.touCat('印') && !extras.touCat('比劫')

  const baseFormed = baseStruct2 // 条件 1、3、4 已分别由 shenRuo / strength / 静态覆盖
  const withExtrasFormed = extStruct2 && extClean

  return emitGeju(
    {
      name: '财多身弱',
      note: baseStruct2
        ? `财透 ${baseTouN} 位，地支主气 ${baseZhiN} 位`
        : `主局财透 ${baseTouN}+岁运${extraCaiTou}, 主气 ${baseZhiN}+岁运${extraCaiZhi}`,
    },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
