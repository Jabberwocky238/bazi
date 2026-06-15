import { readBazi, readShishen } from '../../hooks'
import { WX_CONTROLS } from '../../types'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { checkCong } from './_check'

/**
 * 弃命从财 (从弱派) — 财类数量 ≥ 食伤 且 ≥ 3 位.
 *  _check 处理: 月令从财 / 地支无印比 / 天干印比 base+extras 双判 / 财透 base+extras 双判
 *  本文件: 量化阈值 (主局 only)
 *  岁运透比劫/印 → 复根 Break (由 _check 处理)
 */
export function isCongCaiGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const caiWx = WX_CONTROLS[bazi.dayWx]
  const r = checkCong('财', caiWx)
  if (!r) return null
  const caiN = shishen.countCat('财')
  if (caiN < 3) return null
  if (caiN < shishen.countCat('食伤')) return null
  return emitGeju(
    { name: '弃命从财', note: `${r.note}，财 ${caiN} 位` },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}
