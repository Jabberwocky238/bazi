/**
 * 随机八字命中分布 —— `bun test src/lib/geju/random_geju.spec.ts`
 *
 * 生成 N 个合法随机四柱 (阳干配阳支、阴干配阴支)，跑 detectGeju，
 * 统计：
 *  - 每个格局的命中次数 + 命中率 + 在所属类别里的占比（从多到少）
 *  - 每个类别的命中次数 + 占总命中比
 */

import { test } from 'bun:test'
import type { Sex } from '@jabberwocky238/bazi-engine'
import { baziToPillars } from '../../components/stores/compute'
import { type Bazi } from '../shared'
import { useBazi } from '../shishen'
import { detectGeju, DETECTORS } from './index'
import type { GejuCategory } from './types'

const YANG_GAN = ['甲', '丙', '戊', '庚', '壬'] as const
const YIN_GAN = ['乙', '丁', '己', '辛', '癸'] as const
const YANG_ZHI = ['子', '寅', '辰', '午', '申', '戌'] as const
const YIN_ZHI = ['丑', '卯', '巳', '未', '酉', '亥'] as const

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

// name → category 映射
const nameToCategory: Record<string, GejuCategory> = {}
for (const [name, [, , cat]] of Object.entries(DETECTORS)) {
  nameToCategory[name] = cat
}

const hitCount: Record<string, number> = {}
const categoryCount: Record<string, number> = {}
let totalHits = 0
let errored = 0

for (let i = 0; i < N; i++) {
  const sex: Sex = Math.random() < 0.5 ? 0 : 1
  const bazi = randomBazi()
  try {
    const pillars = baziToPillars(bazi, sex)
    useBazi.getState().setBazi({
      pillars,
      solarStr: '',
      trueSolarStr: '',
      lunarStr: '',
      hourKnown: true,
    })
    const hits = detectGeju()
    for (const h of hits) {
      hitCount[h.name] = (hitCount[h.name] ?? 0) + 1
      const cat = nameToCategory[h.name] ?? '未知'
      categoryCount[cat] = (categoryCount[cat] ?? 0) + 1
      totalHits++
    }
  } catch {
    errored++
  }
}

// —— 输出 ——
console.log(`\n============================================`)
console.log(`  随机 ${N} 盘格局分布 (错误 ${errored} 盘)`)
console.log(`  总命中次数 ${totalHits} · 平均每盘 ${(totalHits / N).toFixed(2)} 个`)
console.log(`============================================`)

// 按命中次数降序
const sorted = Object.entries(hitCount).sort((a, b) => b[1] - a[1])

console.log(`\n【单格局命中 (从多到少)】`)
console.log('  ' + '格局'.padEnd(10) + ' '.repeat(2) + '次数'.padStart(4) + '  命中率   类别内占比   类别')
for (const [name, n] of sorted) {
  const cat = nameToCategory[name] ?? '未知'
  const catTotal = categoryCount[cat] ?? 1
  const pct = ((n / N) * 100).toFixed(1)
  const catPct = ((n / catTotal) * 100).toFixed(1)
  console.log(
    `  ${name.padEnd(10)}  ${String(n).padStart(4)}   ${pct.padStart(5)}%      ${catPct.padStart(5)}%   ${cat}`,
  )
}

console.log(`\n【类别命中分布 (从多到少)】`)
const catSorted = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])
for (const [cat, n] of catSorted) {
  const pct = ((n / totalHits) * 100).toFixed(1)
  console.log(`  ${cat.padEnd(6)}  ${String(n).padStart(5)} 次   占总命中 ${pct.padStart(5)}%`)
  for (const [name, count] of sorted) {
    if (nameToCategory[name] === cat) {
      const pct = ((count / n) * 100).toFixed(1)
      console.log(`    ${name.padEnd(10)} ${String(count).padStart(5)} 次   占类别 ${pct.padStart(5)}%`)
    }
  }
}

// 列出未命中的格局
const unused = Object.keys(DETECTORS).filter((n) => !(n in hitCount))
if (unused.length > 0) {
  console.log(`\n【未命中格局 (${unused.length})】`)
  console.log(`  ${unused.join(', ')}`)
}