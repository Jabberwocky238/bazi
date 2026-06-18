import { describe, expect, test } from 'bun:test'
import type { DetailedPillar } from './base'
import { analyzeStrength } from './strength'

function pillar(gan: string, zhi: string, shishen: string, label: DetailedPillar['label']): DetailedPillar {
  return {
    label,
    gan,
    zhi,
    shishen,
    hideGans: [],
    hideShishen: [],
    nayin: '',
    ganWuxing: '',
    zhiWuxing: '',
    shishenWuxing: '',
    hideShishenWuxings: [],
    shensha: [],
    zizuo: '',
  } as DetailedPillar
}

function pillars(parts: Array<[string, string, string]>): DetailedPillar[] {
  const labels: DetailedPillar['label'][] = ['年柱', '月柱', '日柱', '时柱']
  return parts.map(([gan, zhi, shishen], i) => pillar(gan, zhi, shishen, labels[i]))
}

describe('analyzeStrength', () => {
  test('四柱数量不是 4 时返回 null', () => {
    expect(analyzeStrength([])).toBeNull()
    expect(analyzeStrength(pillars([
      ['甲', '寅', '比肩'],
      ['壬', '亥', '偏印'],
      ['甲', '寅', '日主'],
    ]))).toBeNull()
  })

  test('按完整量化公式判定甲木午月案例为身弱', () => {
    const result = analyzeStrength(pillars([
      ['甲', '寅', '比肩'],
      ['丙', '午', '食神'],
      ['甲', '戌', '日主'],
      ['丁', '卯', '伤官'],
    ]))

    expect(result).not.toBeNull()
    expect(result?.dayGan).toBe('甲')
    expect(result?.dayWx).toBe('木')
    expect(result?.monthZhi).toBe('午')
    expect(result?.monthWx).toBe('火')

    expect(result?.deLing).toBe(false)
    expect(result?.deLingPoints).toBe(-10)
    expect(result?.correction).toBe(-10)
    expect(result?.correctionNote).toBe('死 -10')
    expect(result?.roots.map((r) => [r.pos, r.zhi, r.rawPoints, r.weight, r.points])).toEqual([
      ['年', '寅', 4, 0.8, 3.2],
      ['月', '午', -14, 1.5, -21],
      ['日', '戌', -16, 1.2, -19.2],
      ['时', '卯', 10, 1, 10],
    ])
    expect(result?.rootPoints).toBe(-27)
    expect(result?.ganContribs.map((c) => [c.pos, c.gan, c.shishen, c.isSelf, c.points])).toEqual([
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
      ['甲', '寅', '比肩'],
      ['丙', '寅', '食神'],
      ['甲', '子', '日主'],
      ['乙', '丑', '劫财'],
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

  test('未知时柱跳过时干时支贡献', () => {
    const result = analyzeStrength(pillars([
      ['庚', '申', '七杀'],
      ['辛', '子', '正官'],
      ['甲', '午', '日主'],
      ['', '', ''],
    ]))

    expect(result).not.toBeNull()
    expect(result?.roots).toHaveLength(4)
    expect(result?.roots[3]).toMatchObject({ pos: '时', zhi: '', points: 0, hidden: [] })
    expect(result?.ganContribs.map((c) => [c.pos, c.gan, c.shishen, c.isSelf, c.points])).toEqual([
      ['年', '庚', '七杀', false, -8],
      ['月', '辛', '正官', false, -10],
    ])
  })
})
