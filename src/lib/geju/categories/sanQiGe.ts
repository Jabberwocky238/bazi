import type { Ctx } from '../../types'
import type { GejuHit } from '../../types'
import type { Gan } from '@jabberwocky238/bazi-engine'

/**
 * 三奇格 —— md：天干四位中同时含某一组三奇 (乙丙丁 / 甲戊庚 / 壬癸辛) 全部；
 *   「顺排」: 三奇按 年月日时 顺序出现；「中间字必须在中间位」。
 */
const SAN_QI: Array<[string, string, string]> = [
  ['乙', '丙', '丁'],
  ['甲', '戊', '庚'],
  ['壬', '癸', '辛'],
]

export function isSanQiGe(ctx: Ctx): GejuHit | null {
  const gans = ctx.mainArr.map((p) => p.gan)
  for (const trio of SAN_QI) {
    const positions = trio.map((g) => gans.indexOf(g as Gan))
    if (positions.some((p) => p < 0)) continue
    const sorted = [...positions].sort((a, b) => a - b)
    if (positions.join() !== sorted.join()) return null
    return { name: '三奇格', note: `天干顺排 ${trio.join('')} 三奇` }
  }
  return null
}
