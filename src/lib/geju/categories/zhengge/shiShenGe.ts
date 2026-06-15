import { readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { monthGeFormed } from './_util'

/**
 * 食神格 — 月令食神，身有根，无枭夺食。
 *
 * bazi-skills 5+1 条:
 *  1. 月令本气食神 OR 月令藏 + 透干              [静态]
 *  2. 食神透干通根                                [由 monthGeFormed 近似]
 *  3. 日主有根, 不极弱                            [静态]
 *  4. 无偏印紧贴夺食 (除非财护)                  [岁运透偏印且无财救 → Break]
 *  5. 食神清而不杂                                [由 isShiShangHunZa 独立判]
 *  6. (升格) 财星接应 → 转 食神生财
 */
export function isShiShenGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('食神')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const xiaoDuoShi =
    shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')
  const baseFormed = !xiaoDuoShi

  const extXiaoDuoShi = xiaoDuoShi || (
    extras.tou('偏印') && !shishen.touCat('财') && !extras.touCat('财')
  )
  const withExtrasFormed = !extXiaoDuoShi

  return emitGeju(
    { name: '食神格', note: '月令食神 (本气或透根)，无枭夺食' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
