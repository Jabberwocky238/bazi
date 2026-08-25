import { describe, expect, test } from 'bun:test'
import { Calculator, BaziInputC, type Gan, type Zhi } from '@jabberwocky238/bazi-engine'
import type { DetailedPillar } from './base'
import { analyzeStrength } from './strength'

/**
 * 用真实 Calculator 造柱 —— engine 1.1.0 的 DetailedPillar 持 GanC/ZhiC 值对象,
 * 无法手工字面量伪造; 第三项 (十神) 由 engine 现场算, 故 parts 只给干支。
 * 时柱传 null 即"时辰未知" (engine 只产 3 柱)。
 */
function pillars(parts: Array<[string, string] | null>): DetailedPillar[] {
  const gz = (i: number) => {
    const p = parts[i]
    if (!p) return undefined
    return { gan: p[0] as Gan, zhi: p[1] as Zhi }
  }
  const year = gz(0), month = gz(1), day = gz(2)
  if (!year || !month || !day) throw new Error('年/月/日柱必填')
  // 1.2.0: Calculator 收 BaziInputC
  return new Calculator(BaziInputC.from({ year, month, day, hour: gz(3), sex: 1 })).pillars()
}

describe('analyzeStrength', () => {
  test('四柱数量不是 4 时返回 null', () => {
    expect(analyzeStrength([])).toBeNull()
    expect(analyzeStrength(pillars([
      ['甲', '寅'],
      ['壬', '子'],
      ['甲', '寅'],
    ]))).toBeNull()
  })

  test('按完整量化公式判定甲木午月案例为身弱', () => {
    const result = analyzeStrength(pillars([
      ['甲', '寅'],
      ['丙', '午'],
      ['甲', '戌'],
      ['丁', '卯'],
    ]))

    expect(result).not.toBeNull()
    expect(result?.dayGan.str).toBe('甲')
    expect(result?.dayWx.str).toBe('木')
    expect(result?.monthZhi.str).toBe('午')
    expect(result?.monthWx.str).toBe('火')

    expect(result?.deLing).toBe(false)
    expect(result?.deLingPoints).toBe(-10)
    expect(result?.correction).toBe(-10)
    expect(result?.correctionNote).toBe('死 -10')
    expect(result?.roots.map((r) => [r.pos, r.zhi.str, r.rawPoints, r.weight, r.points])).toEqual([
      ['年', '寅', 4, 0.8, 3.2],
      ['月', '午', -14, 1.5, -21],
      ['日', '戌', -16, 1.2, -19.2],
      ['时', '卯', 10, 1, 10],
    ])
    expect(result?.rootPoints).toBe(-27)
    expect(result?.ganContribs.map((c) => [c.pos, c.gan.str, c.shishen.str, c.isSelf, c.points])).toEqual([
      ['年', '甲', '比肩', true, 8],
      ['月', '丙', '食神', false, -10],
      ['时', '丁', '伤官', false, -10],
    ])
    expect(result?.ganPoints).toBe(-12)
    expect(result?.score).toBe(-49)
    expect(result?.level).toBe('身弱')
  })

  test('按完整量化公式判定甲木寅月案例为身旺', () => {
    const result = analyzeStrength(pillars([
      ['甲', '寅'],
      ['丙', '寅'],
      ['甲', '子'],
      ['乙', '丑'],
    ]))

    expect(result).not.toBeNull()
    expect(result?.deLing).toBe(true)
    expect(result?.deLingPoints).toBe(20)
    expect(result?.correctionNote).toBe('临官 +20')
    expect(result?.rootPoints).toBe(13.2)
    expect(result?.ganPoints).toBe(8)
    expect(result?.score).toBe(41.2)
    expect(result?.level).toBe('身旺')
  })

  // engine 1.1.0 起时辰未知只产 3 柱 (GanC/ZhiC 无空值表示, 不再补占位柱),
  // analyzeStrength 要求 4 柱 → 直接返回 null, 由调用方按 hourKnown 分流。
  test('时辰未知 (3 柱) 返回 null', () => {
    const result = analyzeStrength(pillars([
      ['庚', '申'],
      ['辛', '丑'],
      ['甲', '午'],
      null,
    ]))

    expect(result).toBeNull()
  })
})

describe('人元司令参与评分', () => {
  // 巳月分野: 余气戊5天 → 中气庚9天 → 本气丙16天
  const gengSi = pillars([['甲', '辰'], ['己', '巳'], ['庚', '午'], ['丙', '子']])

  test('不给 dayInMonth 时退回月令本气十二长生', () => {
    const r = analyzeStrength(gengSi)
    expect(r?.siLing).toBeNull()
    expect(r?.correctionNote).toBe('长生 +15')
  })

  test('巳月第10天 庚中气用事 → 日主庚金「旺」', () => {
    const r = analyzeStrength(gengSi, 10)
    expect(r?.siLing?.gan).toBe('庚')
    expect(r?.siLing?.phase).toBe('中气')
    expect(r?.siLing?.isBenQi).toBe(false)
    expect(r?.siLing?.wangShuaiOfDay).toBe('旺')
    expect(r?.correctionNote).toBe('旺 +22')
  })

  test('巳月第25天 丙本气用事 → 日主庚金「死」', () => {
    const r = analyzeStrength(gengSi, 25)
    expect(r?.siLing?.gan).toBe('丙')
    expect(r?.siLing?.phase).toBe('本气')
    expect(r?.siLing?.isBenQi).toBe(true)
    expect(r?.siLing?.wangShuaiOfDay).toBe('死')
    expect(r?.correctionNote).toBe('死 -20')
  })

  // md 明文: 立夏后第十天生者, 按巳火月令判得令, 按庚金司令判则失令 —— 结论相反
  test('同一命盘 司令段不同 → 身强弱级别可翻转', () => {
    const day10 = analyzeStrength(gengSi, 10)
    const day25 = analyzeStrength(gengSi, 25)
    expect(day10!.score - day25!.score).toBe(42)
    expect(day10?.level).toBe('身中(偏弱)')
    expect(day25?.level).toBe('身弱')
  })

  test('超出分野总天数时取本气 (节气长度有浮动)', () => {
    const r = analyzeStrength(gengSi, 99)
    expect(r?.siLing?.phase).toBe('本气')
  })
})
