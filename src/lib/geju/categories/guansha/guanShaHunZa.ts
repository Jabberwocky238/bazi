import { readExtras, readShishen } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 官杀混杂 (病格):
 *  - 显混杂 = 正官 / 七杀 双透。
 *  - 隐混杂 = 一透一藏。
 *  - 均藏不识别。
 *
 * 【岁运】md "流年引混杂": 原局清纯, 岁运带官 / 杀 → 临时混杂 (suiyunTrigger)。
 *   原局已混杂 + 岁运再补另一方 → 加重 (默认仍挂)。
 */
export function isGuanShaHunZa(): GejuHit | null {
  const shishen = readShishen()
  const extras = readExtras()

  const baseHasGuan = shishen.has('正官')
  const baseHasSha = shishen.has('七杀')
  const baseEitherTou = shishen.tou('正官') || shishen.tou('七杀')
  const baseFormed = baseHasGuan && baseHasSha && baseEitherTou

  const withGuan = baseHasGuan || extras.has('正官')
  const withSha = baseHasSha || extras.has('七杀')
  const withEitherTou = baseEitherTou || extras.tou('正官') || extras.tou('七杀')
  const withExtrasFormed = withGuan && withSha && withEitherTou

  const bothTou = shishen.tou('正官') && shishen.tou('七杀')
  const note = bothTou
    ? '正官 + 七杀 天干双透 (显混杂)'
    : (shishen.tou('正官') || shishen.tou('七杀'))
      ? '正官 / 七杀 一透一藏 (隐混杂)'
      : '岁运引混杂'
  return emitGeju(
    { name: '官杀混杂', note },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
