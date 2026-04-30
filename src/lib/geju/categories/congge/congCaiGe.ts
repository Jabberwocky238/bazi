import { readBazi, readShishen } from '../../hooks'
import { WX_CONTROLS } from '../../types'
import type { GejuHit } from '../../types'
import { checkCong } from './_check'

/** 弃命从财（从弱派）：财类数量 ≥ 食伤 且 ≥ 3 位。 */
export function isCongCaiGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const caiWx = WX_CONTROLS[bazi.dayWx]
  const r = checkCong('财', caiWx)
  if (!r) return null
  const caiN = shishen.countCat('财')
  if (caiN < 3) return null
  if (caiN < shishen.countCat('食伤')) return null
  return { name: '弃命从财', note: `${r.note}，财 ${caiN} 位` }
}
