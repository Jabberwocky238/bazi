import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 食伤泄秀 — 身强宜泄, 食或伤吐秀.
 *
 * bazi-skills 5 条 (《子平真诠·论食神》《滴天髓·顺逆》《滴天髓·食神》):
 *  1. 身强 (本格用法的前提)                     [静态]
 *  2. 食 / 伤透干通根 OR 月令本气食伤            [可被岁运补: 岁运透食或伤]
 *  3. 食 / 伤不混杂 (一方为主)                   [岁运透另一方 → Break (混杂)]
 *  4. 无偏印紧贴克食伤 (或有财救)               [岁运透偏印且无财救 → Break]
 *  5. (进阶) 财星接 — 非必要, 不影响成格
 *
 *  本 detector: 1 静态; 2 base + extras 双路径; 3、4 base 严判 + 岁运 Break.
 */
export function isShiShangXieXiu(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  // —— 条件 1: 身强 ——
  if (!strength.shenWang) return null

  // —— 条件 2: 食 / 伤显 ——
  const shiTouRoot = shishen.tou('食神') && shishen.zang('食神')
  const shangTouRoot = shishen.tou('伤官') && shishen.zang('伤官')
  const monthMain = bazi.pillars.month.hideShishen[0]
  const monthIsShiShang = monthMain === '食神' || monthMain === '伤官'
  const baseStruct2 = shiTouRoot || shangTouRoot || monthIsShiShang
  const extStruct2 = baseStruct2 || extras.tou('食神') || extras.tou('伤官')

  // —— 条件 3: 不混杂 (主局严判) ——
  const baseClean3 = !(shishen.tou('食神') && shishen.tou('伤官'))
  // 岁运补另一方 → 临时混杂 → Break
  const extClean3 = baseClean3 && !(
    (shishen.tou('食神') && extras.tou('伤官')) ||
    (shishen.tou('伤官') && extras.tou('食神'))
  )

  // —— 条件 4: 无枭紧贴食伤 (或有财救) ——
  const xiaoAdj =
    shishen.adjacentTou('偏印', '食神') || shishen.adjacentTou('偏印', '伤官')
  const baseClean4 = !(xiaoAdj && !shishen.touCat('财'))
  const extClean4 = baseClean4 && !(
    extras.tou('偏印') && !shishen.touCat('财') && !extras.touCat('财')
  )

  const baseFormed = baseStruct2 && baseClean3 && baseClean4
  const withExtrasFormed = extStruct2 && extClean3 && extClean4

  return emitGeju(
    { name: '食伤泄秀', note: '身旺 · 食/伤透根泄秀 · 清而不杂' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
