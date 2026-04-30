import { readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 伤官格 — 实际判据 (与 md 5 条对照)：
 *  ① 月令本气伤官 (md 条件 1; "伤透 + 月令藏" 路径未实现)。
 *  ② 无正官透 (md 条件 3; 不区分金水伤官喜见官等例外)。
 *  ③ 无食神透 (md 条件 5; 食伤不混)。
 *  ④ 身非极弱 / 近从弱。
 *  伤官透干 + 通根 (md 条件 2): 由 monthGeFormed 月支本气近似覆盖, 未单独 check。
 *  身伤配比 (md 条件 4 决定取用): 当前未据此分支判断, 仅"非极弱"门槛。
 */
export function isShangGuanGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  if (!monthGeFormed('伤官')) return null
  if (shishen.tou('正官')) return null
  if (shishen.tou('食神')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null
  return { name: '伤官格', note: '月令伤官 (本气或透根)，无官可见，不混食' }
}
