import { readBazi, readExtras, readShishen } from '../../hooks'
import type { GejuHit } from '../../types'
import type { Shishen } from '@jabberwocky238/bazi-engine'
import { emitGeju } from '../../_emit'

/**
 * 伤官见官 (病格) — md 4 条 + 金水伤官例外 + 岁运:
 *  ① 伤官与正官同时存在 (主局 OR 岁运), 至少一方透干。
 *  ② 主局两者紧贴 (岁运无序位概念, 见官即视作贴克)。
 *  ③ 无印透救、无财透泄 (主局 / 岁运皆判)。
 *  ④ 金水伤官例外: 庚/辛 日主见官为吉, 不挂。
 */
export function isShangGuanJianGuan(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()
  if (bazi.dayWx === '金') return null

  const shangPos = posOfShishen('伤官')
  const guanPos = posOfShishen('正官')

  const baseBothPresent = shangPos.length > 0 && guanPos.length > 0
  const baseEitherTou = shishen.tou('伤官') || shishen.tou('正官')
  const baseClose = shangPos.some((a) => guanPos.some((b) => Math.abs(a - b) <= 1))
  const baseRescue = shishen.touCat('印') || shishen.touCat('财')
  const baseFormed = baseBothPresent && baseEitherTou && baseClose && !baseRescue

  // 岁运视作"加入"主局 — 透或藏 任一方在岁运补足即满足"双方存在 + 至少一方透"
  const withShangPresent = shangPos.length > 0 || extras.has('伤官')
  const withGuanPresent = guanPos.length > 0 || extras.has('正官')
  const withEitherTou = baseEitherTou || extras.tou('伤官') || extras.tou('正官')
  const withRescue = baseRescue || extras.touCat('印') || extras.touCat('财')
  // 紧贴要求: 主局已紧贴 OR 主局有伤官透/正官透 而岁运补另一方 (视作贴克)
  const withClose = baseClose
    || (shishen.tou('伤官') && extras.tou('正官'))
    || (shishen.tou('正官') && extras.tou('伤官'))
  const withExtrasFormed = withShangPresent && withGuanPresent && withEitherTou && withClose && !withRescue

  return emitGeju(
    { name: '伤官见官', note: '伤官正官同现 · 紧贴 · 无印财救' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

function posOfShishen(name: Shishen): number[] {
  const bazi = readBazi()
  const positions = new Set<number>()
  bazi.mainArr.forEach((p, i) => {
    if (p.shishen === name) positions.add(i)
    if (p.hideShishen.includes(name)) positions.add(i)
  })
  return Array.from(positions)
}
