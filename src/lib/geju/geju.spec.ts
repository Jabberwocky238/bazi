/**
 * 格局命中断言 —— `bun test src/lib/geju/geju.spec.ts`
 *
 * 表驱动：每条 case 给 (四柱干支 + 必须命中的格局名列表 + 必须不命中的格局名列表)。
 *  - include 中任一格局没被 detectGeju 检出 → fail
 *  - exclude 中任一格局被 detectGeju 检出   → fail
 */

import { test, expect } from 'bun:test'
import type { Sex } from '@jabberwocky238/bazi-engine'
import { baziToPillars, type Bazi } from '../shishen'
import { detectGeju } from './index'

interface Case {
  bazi: Bazi                   // 年月日时干支，如 ['甲子','己巳','壬子','乙巳']
  sex: Sex                     // 1 = 男, 0 = 女
  include?: string[]           // 必须命中的格局名
  exclude?: string[]           // 必须不命中的格局名
  desc?: string
}

// ———— 在这里加 case ————
const CASES: Case[] = [
  {
    bazi: ['癸未', '乙卯', '壬午', '戊申'],
    sex: 1,
    include: ['伤官格'],
    desc: 'dk',
  },
  {
    bazi: ['庚辰', '戊子', '丙寅', '甲午'],
    sex: 1,
    include: ['正官格'],
    desc: 'gjx',
  },
  {
    bazi: ['癸未', '癸亥', '庚戌', '甲申'],
    sex: 1,
    include: ['食神格'],
    desc: 'hjt',
  },
  {
    bazi: ['甲申', '己巳', '壬辰', '戊申'],
    sex: 1,
    include: ['偏财格'],
    desc: 'lyp',
  },
  {
    bazi: ['甲申', '丙寅', '癸亥', '壬子'],
    sex: 1,
    include: ['伤官格'],
    desc: 'lzm',
  },
  {
    bazi: ['癸未', '戊午', '壬申', '乙巳'],
    sex: 0,
    include: ['正财格'],
    desc: 'wsy',
  },
  {
    bazi: ['壬午', '壬子', '癸酉', '甲寅'],
    sex: 0,
    include: ['建禄格'],
    desc: 'pyb',
  },
  {
    bazi: ['庚寅', '乙酉', '庚午', '辛巳'],
    sex: 0,
    include: ['阳刃格'],
    desc: 'pybsis',
  },
  {
    bazi: ['壬申', '戊申', '乙酉', '丙子'],
    sex: 0,
    include: ['正官格'],
    desc: 'qw',
  },
  {
    bazi: ['癸未', '己未', '己酉', '戊辰'],
    sex: 1,
    include: ['稼穑格'],
  },
  {
    bazi: ['癸卯', '甲寅', '辛卯', '戊戌'],
    sex: 1,
    include: ['食神生财', '杀印相生'],
    desc: '黄仁勋',
  },
  {
    bazi: ['癸未', '乙卯', '癸未', '丁巳'],
    sex: 1,
    include: ['弃命从势'],
    desc: 'fzy',
  },
  {
    bazi: ['癸未', '丁巳', '己亥', '甲戌'],
    sex: 1,
    include: ['阳刃格'],
    exclude: ['正官格'],
    desc: 'zzt',
  },
  {
    bazi: ['乙酉', '丙子', '乙丑', '庚辰'],
    sex: 1,
    include: ['寒木向阳'],
    desc: '雷军',
  },
]
// ————————————————————

for (const c of CASES) {
  const gz = c.bazi.join(' ')
  const label = `${gz} ${c.sex === 1 ? '男' : '女'}${c.desc ? ` · ${c.desc}` : ''}`

  test(label, () => {
    const pillars = baziToPillars(c.bazi, c.sex)
    const hits = detectGeju(pillars)
    const hitNames = hits.map((x) => x.name)
    const hitSet = new Set(hitNames)

    const hitLabels = hits.map((h) => (h.guigeVariant ? `${h.name}(变体:${h.guigeVariant})` : h.name))
    console.log(`\n${label}`)
    console.log(`  命中 [${hitLabels.join(', ') || '无'}]`)

    const missing = (c.include ?? []).filter((n) => !hitSet.has(n))
    const forbidden = (c.exclude ?? []).filter((n) => hitSet.has(n))
    if (missing.length > 0) console.log(`  缺失 [${missing.join(', ')}]`)
    if (forbidden.length > 0) console.log(`  误命中 [${forbidden.join(', ')}]`)
    expect({ missing, forbidden }).toEqual({ missing: [], forbidden: [] })
  })
}
