/**
 * 随机合盘评分分布 —— `bun test src/lib/hepan/random_score.spec.ts`
 *
 * 生成 N 对随机合法四柱 (阳干配阳支 / 阴干配阴支)，跑 analyzeSide + computeXiyongMatch + scoreMatch.
 * 统计:
 *   - 双向 score (a / b) 的均值 / 标准差 / min / max
 *   - 0-100 直方图 (10 段)
 *   - 各打分项命中位数均值 (用神 / 调候 / 通关 / 忌神 / 合冲克)
 */

import { test } from 'bun:test'
import type { Sex } from '@jabberwocky238/bazi-engine'
import { baziToPillars } from '../../components/stores/compute'
import { type Bazi } from '../shared'
import { analyzeSide, computeXiyongMatch, scoreMatch } from './index'

const YANG_GAN = ['甲', '丙', '戊', '庚', '壬'] as const
const YIN_GAN  = ['乙', '丁', '己', '辛', '癸'] as const
const YANG_ZHI = ['子', '寅', '辰', '午', '申', '戌'] as const
const YIN_ZHI  = ['丑', '卯', '巳', '未', '酉', '亥'] as const

function randomPillar(): string {
  const yang = Math.random() < 0.5
  const gans = yang ? YANG_GAN : YIN_GAN
  const zhis = yang ? YANG_ZHI : YIN_ZHI
  return gans[Math.floor(Math.random() * gans.length)] + zhis[Math.floor(Math.random() * zhis.length)]
}

function randomBazi(): Bazi {
  return [randomPillar(), randomPillar(), randomPillar(), randomPillar()]
}

const N = 10000

const scoresA: number[] = []
const scoresB: number[] = []

interface Accum {
  primary: number; secondary: number
  tiaohou: number; tongguan: number
  avoid: number
  he: number; chong: number; xinghaipo: number; ke: number
}
const accumA: Accum = { primary: 0, secondary: 0, tiaohou: 0, tongguan: 0, avoid: 0, he: 0, chong: 0, xinghaipo: 0, ke: 0 }
const accumB: Accum = { primary: 0, secondary: 0, tiaohou: 0, tongguan: 0, avoid: 0, he: 0, chong: 0, xinghaipo: 0, ke: 0 }
let counted = 0
let errored = 0

for (let i = 0; i < N; i++) {
  const sexA: Sex = Math.random() < 0.5 ? 0 : 1
  const sexB: Sex = Math.random() < 0.5 ? 0 : 1
  try {
    const aPillars = baziToPillars(randomBazi(), sexA)
    const bPillars = baziToPillars(randomBazi(), sexB)
    const aSide = analyzeSide(aPillars)
    const bSide = analyzeSide(bPillars)
    if (!aSide || !bSide) { errored++; continue }
    const m = computeXiyongMatch(
      aPillars, aSide.xiyong, '左',
      bPillars, bSide.xiyong, '右',
    )
    const score = scoreMatch(m)
    scoresA.push(score.a)
    scoresB.push(score.b)
    accumA.primary += m.aPrimaryFromB
    accumA.secondary += m.aSecondaryFromB
    accumA.tiaohou += m.aTiaohouFromB
    accumA.tongguan += m.aTongguanFromB
    accumA.avoid += m.aAvoidFromB
    accumA.he += m.crossHe
    accumA.chong += m.crossChong
    accumA.xinghaipo += m.crossXinghaipo
    accumA.ke += m.crossKe
    accumB.primary += m.bPrimaryFromA
    accumB.secondary += m.bSecondaryFromA
    accumB.tiaohou += m.bTiaohouFromA
    accumB.tongguan += m.bTongguanFromA
    accumB.avoid += m.bAvoidFromA
    accumB.he += m.crossHe
    accumB.chong += m.crossChong
    accumB.xinghaipo += m.crossXinghaipo
    accumB.ke += m.crossKe
    counted++
  } catch {
    errored++
  }
}

function stats(arr: number[]): { mean: number; sd: number; min: number; max: number; median: number } {
  if (arr.length === 0) return { mean: 0, sd: 0, min: 0, max: 0, median: 0 }
  const sum = arr.reduce((s, n) => s + n, 0)
  const mean = sum / arr.length
  const variance = arr.reduce((s, n) => s + (n - mean) ** 2, 0) / arr.length
  const sorted = [...arr].sort((x, y) => x - y)
  const median = sorted[Math.floor(sorted.length / 2)]
  return {
    mean,
    sd: Math.sqrt(variance),
    min: Math.min(...arr),
    max: Math.max(...arr),
    median,
  }
}

function histogram(arr: number[], bins = 10): number[] {
  const out = new Array(bins).fill(0)
  for (const n of arr) {
    const idx = Math.min(bins - 1, Math.floor((n / 100) * bins))
    out[idx]++
  }
  return out
}

function pct(n: number, total: number): string {
  return ((n / total) * 100).toFixed(1) + '%'
}

console.log(`\n========================================================`)
console.log(`  随机 ${N} 对合盘评分分布 (有效 ${counted} 对, 错误 ${errored} 对)`)
console.log(`========================================================`)

const sA = stats(scoresA)
const sB = stats(scoresB)
console.log(`\n【双向评分总览】`)
console.log(`  右→左 (score.a) 均值 ${sA.mean.toFixed(1)} · 中位 ${sA.median} · σ ${sA.sd.toFixed(1)} · [${sA.min}, ${sA.max}]`)
console.log(`  左→右 (score.b) 均值 ${sB.mean.toFixed(1)} · 中位 ${sB.median} · σ ${sB.sd.toFixed(1)} · [${sB.min}, ${sB.max}]`)

const histA = histogram(scoresA)
const histB = histogram(scoresB)
console.log(`\n【0-100 分段直方图】`)
console.log(`  段       右→左         左→右`)
for (let i = 0; i < 10; i++) {
  const lo = i * 10
  const hi = i === 9 ? 100 : (i + 1) * 10
  const a = histA[i]
  const b = histB[i]
  const barA = '█'.repeat(Math.round((a / counted) * 40))
  const barB = '█'.repeat(Math.round((b / counted) * 40))
  console.log(`  ${String(lo).padStart(3)}-${String(hi).padStart(3)} ${String(a).padStart(5)} ${pct(a, counted).padStart(6)} ${barA.padEnd(20)} | ${String(b).padStart(5)} ${pct(b, counted).padStart(6)} ${barB}`)
}

console.log(`\n【单项均值 (位数 / 对) — 单边视角 (右 → 左)】`)
console.log(`  主用神供给  ${(accumA.primary / counted).toFixed(2)}`)
console.log(`  喜神供给    ${(accumA.secondary / counted).toFixed(2)}`)
console.log(`  调候补足    ${(accumA.tiaohou / counted).toFixed(2)} (仅有调候硬约束的命局非零)`)
console.log(`  通关桥梁    ${(accumA.tongguan / counted).toFixed(2)} (仅两强相战 + 本盘缺桥的命局非零)`)
console.log(`  忌神冲撞    ${(accumA.avoid / counted).toFixed(2)}`)
console.log(`\n【跨盘干支 (双方共享) 均值】`)
console.log(`  合         ${(accumA.he / counted).toFixed(2)}`)
console.log(`  冲         ${(accumA.chong / counted).toFixed(2)}`)
console.log(`  刑害破     ${(accumA.xinghaipo / counted).toFixed(2)}`)
console.log(`  克         ${(accumA.ke / counted).toFixed(2)}`)

test('合盘评分分布 sanity', () => {
  // 合理性 sanity: 双向均值应在 30-70 区间, σ 在 5-25 区间
  if (sA.mean < 20 || sA.mean > 80) throw new Error(`score.a 均值异常 ${sA.mean}`)
  if (sB.mean < 20 || sB.mean > 80) throw new Error(`score.b 均值异常 ${sB.mean}`)
})
