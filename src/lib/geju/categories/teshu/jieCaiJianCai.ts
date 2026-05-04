import { readExtras, readShishen } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 劫财见财 (病象) — 比劫强而财弱, 无官护无食伤通关.
 *
 * bazi-skills 5 条 (《滴天髓·顺逆》《滴天髓·财》《渊海子平·论财》《子平真诠·论财》):
 *  1. 劫财透干通根 OR 月令本气比劫              [可被岁运补: 岁运透劫财 → 临时劫财见财]
 *  2. 财星透干或本气, 能被克到                  [岁运透财 → 也可触发 (财大运被夺)]
 *  3. 财弱于比劫 (财轻劫重)                     [岁运透比劫加重]
 *  4. 无官星护财                                 [岁运透官 → 救应 → withExtrasFormed=false (退出病格)]
 *  5. 无食伤通关                                 [岁运透食伤 → 救应 → withExtrasFormed=false]
 *
 *  本 detector: 1、2、3 主局严判 + 岁运补 (Trigger 路径); 4、5 主局严判 + 岁运
 *  透官 / 食伤 → 视为"救应"使病象消解 (withExtrasFormed=false → 显+Break,
 *  UI 上由 Break 红框提示该病已被岁运化解)。
 */
export function isJieCaiJianCai(): GejuHit | null {
  const shishen = readShishen()
  const extras = readExtras()

  // —— 条件 1: 劫财显 (透+通根) ——
  const baseStruct1 = shishen.tou('劫财') && shishen.zang('劫财')
  const extStruct1 = baseStruct1 || (extras.tou('劫财') && shishen.has('劫财'))

  // —— 条件 2: 财显 ——
  const baseStruct2 = shishen.touCat('财')
  const extStruct2 = baseStruct2 || extras.touCat('财')

  // —— 条件 3: 财轻劫重 ——
  const baseBijieN = shishen.countCat('比劫')
  const baseCaiN = shishen.countCat('财')
  const extraBijieAdd = extras.extraArr.filter(
    (p) => p.shishen === '比肩' || p.shishen === '劫财',
  ).length
  const extraCaiAdd = extras.extraArr.filter(
    (p) => p.shishen === '正财' || p.shishen === '偏财',
  ).length
  const baseStruct3 = baseBijieN > baseCaiN
  const extStruct3 = (baseBijieN + extraBijieAdd) > (baseCaiN + extraCaiAdd)

  // —— 条件 4 / 5: 主局无官 / 无食伤 (本病象成立的反面是"被救") ——
  const baseClean = !shishen.touCat('官杀') && !shishen.touCat('食伤')
  const extClean = baseClean && !extras.touCat('官杀') && !extras.touCat('食伤')

  const baseFormed = baseStruct1 && baseStruct2 && baseStruct3 && baseClean
  const withExtrasFormed = extStruct1 && extStruct2 && extStruct3 && extClean

  return emitGeju(
    { name: '劫财见财', note: '劫财透根 · 财弱无官食救 · 夺财' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
