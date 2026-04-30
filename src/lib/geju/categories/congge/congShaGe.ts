import { readBazi, readShishen } from '../../hooks'
import { WX_CONTROLLED_BY } from '../../types'
import type { GejuHit } from '../../types'
import { checkCong } from './_check'

/** 弃命从煞 —— md：「官杀数量 ≥ 财星」「官杀数量 > 食伤」+ 「无食伤克官杀」+ 官杀 ≥ 5 位。 */
export function isCongShaGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const ksWx = WX_CONTROLLED_BY[bazi.dayWx]
  const r = checkCong('官杀', ksWx)
  if (!r) return null
  const gsN = shishen.countCat('官杀')
  if (gsN < 5) return null
  if (gsN < shishen.countCat('财')) return null
  if (gsN <= shishen.countCat('食伤')) return null
  if (shishen.touCat('食伤')) return null
  return { name: '弃命从煞', note: `${r.note}，官杀 ${gsN} 位主导` }
}
