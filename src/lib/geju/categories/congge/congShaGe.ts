import { readBazi, readExtras, readShishen } from '../../hooks'
import { WX_CONTROLLED_BY } from '../../types'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { checkCong } from './_check'

/**
 * 弃命从煞 — 官杀数量 ≥ 5 + 官杀 ≥ 财星 + 官杀 > 食伤 + 无食伤克官杀.
 *  _check: 月令从杀 / 地支无印比 / 天干印比 base+extras / 杀透 base+extras
 *  本文件: 量化 + 无食伤透 (岁运透食伤 → Break)
 */
export function isCongShaGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()
  const ksWx = WX_CONTROLLED_BY[bazi.dayWx]
  const r = checkCong('官杀', ksWx)
  if (!r) return null
  const gsN = shishen.countCat('官杀')
  if (gsN < 5) return null
  if (gsN < shishen.countCat('财')) return null
  if (gsN <= shishen.countCat('食伤')) return null
  if (shishen.touCat('食伤')) return null

  const baseFormed = r.baseFormed
  const withExtrasFormed = r.withExtrasFormed && !extras.touCat('食伤')

  return emitGeju(
    { name: '弃命从煞', note: `${r.note}，官杀 ${gsN} 位主导` },
    { baseFormed, withExtrasFormed, hasExtras: r.hasExtras },
  )
}
