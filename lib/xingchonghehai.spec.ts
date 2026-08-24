/**
 * 随机干支合冲刑害分布 —— `bun test src/lib/ganzhi.spec.ts`
 *
 * 生成 N 个合法随机四柱 + 大运/流年/流月，跑 analyzeGanZhiWithExtras，
 * 统计并打印：
 *  - 原局 analyzeGanZhi 各类 finding 的命中次数
 *  - extras × 原局 两两引入的合冲刑害次数
 *  - 原局冲突被 extras 引化 dissolved 的次数
 */

import { describe, expect, test } from 'bun:test'
import type { Gan, Pillar, Zhi } from '@jabberwocky238/bazi-engine'
import { analyzeGanZhiWithExtras, type ExtraGanZhiInput, type ExtraSourceLabel } from './xingchonghehai'

const YANG_GAN = ['甲', '丙', '戊', '庚', '壬'] as const
const YIN_GAN = ['乙', '丁', '己', '辛', '癸'] as const
const YANG_ZHI = ['子', '寅', '辰', '午', '申', '戌'] as const
const YIN_ZHI = ['丑', '卯', '巳', '未', '酉', '亥'] as const
const EXTRA_LABELS: ExtraSourceLabel[] = ['大运', '流年', '流月']

function randomPillar(): Pillar {
  const yang = Math.random() < 0.5
  const gans = yang ? YANG_GAN : YIN_GAN
  const zhis = yang ? YANG_ZHI : YIN_ZHI
  return {
    gan: gans[Math.floor(Math.random() * gans.length)] as Gan,
    zhi: zhis[Math.floor(Math.random() * zhis.length)] as Zhi,
  }
}

function randomExtras(): ExtraGanZhiInput[] {
  return EXTRA_LABELS.map((label) => {
    const p = randomPillar()
    return { label, gan: p.gan, zhi: p.zhi }
  })
}

function bump(map: Record<string, number>, key: string, n = 1): void {
  map[key] = (map[key] ?? 0) + n
}

function printSorted(title: string, count: Record<string, number>, total: number): void {
  const sorted = Object.entries(count).sort((a, b) => b[1] - a[1])
  console.log(`\n【${title}】`)
  for (const [name, n] of sorted) {
    const pct = total > 0 ? ((n / total) * 100).toFixed(1) : '0.0'
    console.log(`  ${name.padEnd(10)} ${String(n).padStart(6)} 次   占比 ${pct.padStart(5)}%`)
  }
}

describe('analyzeGanZhiWithExtras 大数定律模拟', () => {
  test('随机四柱 + 岁运合冲刑害命中分布', () => {
    const N = 10000

    const baseKindCount: Record<string, number> = {}
    const extraKindCount: Record<string, number> = {}
    const extraSourceCount: Record<string, number> = {}
    const dissolvedKindCount: Record<string, number> = {}
    const dissolvedSourceCount: Record<string, number> = {}

    let totalBase = 0
    let totalExtra = 0
    let totalDissolved = 0
    let nulled = 0
    let errored = 0

    for (let i = 0; i < N; i++) {
      const pillars = [randomPillar(), randomPillar(), randomPillar(), randomPillar()]
      const extras = randomExtras()

      try {
        const analysis = analyzeGanZhiWithExtras(pillars, extras)
        if (!analysis) {
          nulled++
          continue
        }

        // 1.2.0: 关系已按 合/冲/刑/害/破克暗合 分好组
        for (const [group, list] of Object.entries(analysis.groups)) {
          bump(baseKindCount, group, list.length)
          totalBase += list.length
        }

        for (const item of analysis.extra) {
          bump(extraKindCount, item.kind)
          bump(extraSourceCount, item.source.label)
          totalExtra++
        }

        for (const item of analysis.dissolved) {
          bump(dissolvedKindCount, item.kind)
          bump(dissolvedSourceCount, item.by.label)
          totalDissolved++
        }
      } catch {
        errored++
      }
    }

    console.log(`\n============================================`)
    console.log(`  随机 ${N} 盘干支合冲刑害分布 (null ${nulled} 盘 · 错误 ${errored} 盘)`)
    console.log(`  原局命中 ${totalBase} 次 · 平均每盘 ${(totalBase / N).toFixed(2)} 个`)
    console.log(`  岁运引入 ${totalExtra} 次 · 平均每盘 ${(totalExtra / N).toFixed(2)} 个`)
    console.log(`  引化解除 ${totalDissolved} 次 · 平均每盘 ${(totalDissolved / N).toFixed(2)} 个`)
    console.log(`============================================`)

    printSorted('原局 finding 命中 (从多到少)', baseKindCount, totalBase)
    printSorted('岁运 extra 命中 (从多到少)', extraKindCount, totalExtra)
    printSorted('岁运 source 命中 (从多到少)', extraSourceCount, totalExtra)
    printSorted('引化 dissolved 原局类型 (从多到少)', dissolvedKindCount, totalDissolved)
    printSorted('引化 source 命中 (从多到少)', dissolvedSourceCount, totalDissolved)

    expect(errored).toBe(0)
    expect(nulled).toBe(0)
    expect(totalExtra).toBeGreaterThan(0)
  })
})
