import { readBazi, readShishen } from '../../hooks'
import { YANG_REN } from '../../types'
import type { Shishen } from '@jabberwocky238/bazi-engine'

/** 正格通用钩子：月支若是日主的阳刃/阴刃位 → 所有正格让位给阳刃格。 */
export function deferToYangRen(): boolean {
  const bazi = readBazi()
  return bazi.monthZhi === YANG_REN[bazi.dayGan]
}

/**
 * 通用"月令X格"工厂 — 双路径入格 (与 md《子平真诠》一致)：
 *  - 月支若同时是阳刃位 → 归阳刃格独占, 所有正格不成立。
 *  - 路径 1: 月令**本气**为 target。
 *  - 路径 2: 月令中气 / 余气藏 target, 且 target **透干**。
 */
export function monthGeFormed(target: Shishen): boolean {
  if (deferToYangRen()) return false
  const bazi = readBazi()
  const shishen = readShishen()
  const monthHide = bazi.pillars.month.hideShishen as Shishen[]
  if ((monthHide[0] as Shishen | undefined) === target) return true
  if (monthHide.includes(target) && shishen.tou(target)) return true
  return false
}
