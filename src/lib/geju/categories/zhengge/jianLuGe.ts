import { readBazi, readExtras, readShishen } from '../../hooks'
import { CHONG_PAIR, LU } from '../../types'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 建禄格 — md 全部 4 条 + 岁运:
 *  ① 月支本气为日主之禄。
 *  ② 月令不被冲 (主局 / 岁运冲均破)。
 *  ③ 官 / 财 / 食伤 之一透干且通根 (主局 OR 岁运补)。
 *  ④ 身不过旺。
 *
 * 【岁运】md 明文 "建禄格最怕月令逢冲——大运流年冲月令则格局力破"。
 *   - 大运 / 流年 含月令地支之冲 (CHONG_PAIR[monthZhi]) → 主局成格也被破 (suiyunBreak)。
 *   - 主局缺 出口 (官 / 财 / 食伤) 时, 岁运补出口可激活成格 (suiyunTrigger)。
 */
export function isJianLuGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()
  if (bazi.monthZhi !== LU[bazi.dayGan]) return null

  const baseChong = bazi.monthZhiBeingChong
  const extrasChong = extras.extraArr.some((p) => CHONG_PAIR[bazi.monthZhi] === p.zhi)

  const officerRooted = shishen.touCat('官杀') && (shishen.zang('正官') || shishen.zang('七杀'))
  const caiRooted = shishen.touCat('财') && (shishen.zang('正财') || shishen.zang('偏财'))
  const shiShangRooted = shishen.touCat('食伤') && (shishen.zang('食神') || shishen.zang('伤官'))
  const baseHasOut = officerRooted || caiRooted || shiShangRooted

  const extrasOfficer = extras.touCat('官杀') && (shishen.has('正官') || shishen.has('七杀'))
  const extrasCai = extras.touCat('财') && (shishen.has('正财') || shishen.has('偏财'))
  const extrasShang = extras.touCat('食伤') && (shishen.has('食神') || shishen.has('伤官'))
  const withExtrasOut = baseHasOut || extrasOfficer || extrasCai || extrasShang

  const overstrong = shishen.countCat('比劫') + shishen.countCat('印') >= 6

  const baseFormed = !baseChong && baseHasOut && !overstrong
  const withExtrasFormed = !baseChong && !extrasChong && withExtrasOut && !overstrong

  return emitGeju(
    { name: '建禄格', note: `月令 ${bazi.monthZhi} 临日主 ${bazi.dayGan} 之禄，带官/财/食伤透根为用` },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
