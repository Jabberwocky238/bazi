import { readBazi, readExtras } from '../../hooks'
import { CHONG_PAIR } from '../../types'
import type { GejuHit } from '../../types'
import type { Gan } from '@jabberwocky238/bazi-engine'
import { emitGeju } from '../../_emit'

/**
 * 三奇格 — 天干四位顺排某组三奇 (乙丙丁 / 甲戊庚 / 壬癸辛).
 *
 *  bazi-skills 条件:
 *   1. 天干四位含某组三奇 (静态)
 *   2. 顺排 (年月日时 顺序), 中间字在中间位 (静态)
 *
 *  【岁运】md 内容.md:
 *   - 冲三奇之干的大运 / 流年 → 贵气受损 Break
 *   - 合去三奇之一的大运 → 三奇残缺暂时失格 Break
 *   - 地支冲破型遇大运填实 → 贵气回归 Trigger (本实现略)
 *
 *  本 detector 实现: 主局严判结构 + 岁运地支冲三奇所在天干对应支 → Break.
 */
const SAN_QI: Array<[string, string, string]> = [
  ['乙', '丙', '丁'],
  ['甲', '戊', '庚'],
  ['壬', '癸', '辛'],
]

// 天干对应禄支 (查冲)
const GAN_LU: Record<string, string> = {
  甲: '寅', 乙: '卯', 丙: '巳', 丁: '午',
  戊: '巳', 己: '午', 庚: '申', 辛: '酉',
  壬: '亥', 癸: '子',
}

export function isSanQiGe(): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()
  const gans = bazi.mainArr.map((p) => p.gan)
  for (const trio of SAN_QI) {
    const positions = trio.map((g) => gans.indexOf(g as Gan))
    if (positions.some((p) => p < 0)) continue
    const sorted = [...positions].sort((a, b) => a - b)
    if (positions.join() !== sorted.join()) return null

    // 岁运地支冲三奇之禄支 → Break
    const extraZhis = extras.extraArr.map((p) => p.zhi as string)
    const breakByChong = trio.some((g) => {
      const lu = GAN_LU[g]
      return lu && extraZhis.includes(CHONG_PAIR[lu])
    })

    return emitGeju(
      { name: '三奇格', note: `天干顺排 ${trio.join('')} 三奇` },
      { baseFormed: true, withExtrasFormed: !breakByChong, hasExtras: extras.active },
    )
  }
  return null
}
