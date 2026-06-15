import { readExtras, readShishen } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 枭神夺食 (病格) — md 3 维度 + 救应 + 岁运:
 *  ① 偏印透 + 食神存在 (主局 OR 岁运)。
 *  ② 食神透干时 偏印与食神 紧贴克制。
 *  ③ 救应: 财 / 比劫 透 → 不夺 (主局 OR 岁运皆生效)。
 *  ④ 月令伤官且伤官透干 → 让位伤官格。
 *
 *  岁运:
 *   - 主局未挂(原本无偏印或有救应) + 岁运补偏印 / 抹除救应 → suiyunTrigger (病发).
 *   - 主局已挂 + 岁运补财/比劫救应 → suiyunBreak (化解).
 */
export function isXiaoShenDuoShi(): GejuHit | null {
  const shishen = readShishen()
  const extras = readExtras()

  // 月令伤官透 → 不报本病
  if (shishen.mainAt('伤官').includes(1) && shishen.tou('伤官')) return null

  // 偏印 (主局 / 岁运)
  const baseXiao = shishen.tou('偏印')
  const withXiao = baseXiao || extras.tou('偏印')
  // 食神 存在 (主局 / 岁运)
  const baseFood = shishen.has('食神')
  const withFood = baseFood || extras.has('食神')
  // 救应: 财 / 比劫 (主局 / 岁运)
  const baseRescue = shishen.touCat('财') || shishen.touCat('比劫')
  const withRescue = baseRescue || extras.touCat('财') || extras.touCat('比劫')
  // 食神透干时, 必须紧贴偏印方算"夺"
  const adjBlockBase = shishen.tou('食神') && !shishen.adjacentTou('偏印', '食神')
  // 岁运透食神时无法判断紧贴 (extras 不在 main 序列), 保守视作不破紧贴要求

  const baseFormed = baseXiao && baseFood && !baseRescue && !adjBlockBase
  const withExtrasFormed = withXiao && withFood && !withRescue && !adjBlockBase

  return emitGeju(
    { name: '枭神夺食', note: '偏印透克食神，无财无比劫救' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
