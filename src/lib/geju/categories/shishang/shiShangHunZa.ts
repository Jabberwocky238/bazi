import { readExtras, readShishen } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 食伤混杂 (病格): 食神与伤官 同时透干 触发病象。
 *  md 维度 3 救应: 印 (制食伤) / 财 (化食伤) 透 → 不挂。
 *
 * 【岁运】md 维度 4 双向影响:
 *   - 主局单透 + 岁运透另一方 → 病发 (suiyunTrigger)。
 *   - 主局双透 + 岁运补印/财救应 → 化解 (suiyunBreak)。
 */
export function isShiShangHunZa(): GejuHit | null {
  const shishen = readShishen()
  const extras = readExtras()

  const baseDouble = shishen.tou('食神') && shishen.tou('伤官')
  const baseRescue = shishen.touCat('印') || shishen.touCat('财')
  const baseFormed = baseDouble && !baseRescue

  const withDouble = baseDouble
    || (shishen.tou('食神') && extras.tou('伤官'))
    || (shishen.tou('伤官') && extras.tou('食神'))
    || (extras.tou('食神') && extras.tou('伤官'))
  const withRescue = baseRescue || extras.touCat('印') || extras.touCat('财')
  const withExtrasFormed = withDouble && !withRescue

  return emitGeju(
    { name: '食伤混杂', note: '食神伤官双透' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
