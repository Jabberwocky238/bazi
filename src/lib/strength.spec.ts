import { describe, expect, test } from 'bun:test'
import type { Pillar } from './store'
import { analyzeStrength } from './strength'

function pillar(gan: string, zhi: string, shishen: string, label: Pillar['label']): Pillar {
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
  } as Pillar
}

function pillars(parts: Array<[string, string, string]>): Pillar[] {
  const labels: Pillar['label'][] = ['年柱', '月柱', '日柱', '时柱']
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

  test('统计得令、四柱根和天干同党贡献，判为身极旺', () => {
    const result = analyzeStrength(pillars([
      ['甲', '寅', '比肩'],
      ['壬', '亥', '偏印'],
      ['甲', '寅', '日主'],
      ['乙', '卯', '劫财'],
    ]))

    expect(result).not.toBeNull()
    expect(result?.dayGan).toBe('甲')
    expect(result?.dayWx).toBe('木')
    expect(result?.monthZhi).toBe('亥')
    expect(result?.monthWx).toBe('水')

    expect(result?.deLing).toBe(true)
    expect(result?.deLingPoints).toBe(3)
    expect(result?.roots.map((r) => [r.pos, r.zhi, r.kind, r.label, r.points])).toEqual([
      ['年', '寅', 'benqi', '本气旁根', 2],
      ['月', '亥', 'zhongqi', '中气旁根', 1],
      ['日', '寅', 'benqi', '本气正根', 3],
      ['时', '卯', 'benqi', '本气旁根', 2],
    ])
    expect(result?.rootPoints).toBe(8)
    expect(result?.ganContribs.map((c) => [c.pos, c.gan, c.shishen, c.isSelf, c.points])).toEqual([
      ['年', '甲', '比肩', true, 1],
      ['月', '壬', '偏印', true, 1],
      ['时', '乙', '劫财', true, 1],
    ])
    expect(result?.ganPoints).toBe(3)
    expect(result?.correction).toBe(0)
    expect(result?.score).toBe(14)
    expect(result?.level).toBe('身极旺')
  })

  test('月令得令但无中气以上根时扣分，并跳过未知时干', () => {
    const result = analyzeStrength(pillars([
      ['庚', '申', '七杀'],
      ['辛', '子', '正官'],
      ['甲', '午', '日主'],
      ['', '', ''],
    ]))

    expect(result).not.toBeNull()
    expect(result?.deLing).toBe(true)
    expect(result?.deLingPoints).toBe(3)
    expect(result?.rootPoints).toBe(0)
    expect(result?.ganContribs).toHaveLength(2)
    expect(result?.ganContribs.map((c) => [c.pos, c.gan, c.shishen, c.isSelf, c.points])).toEqual([
      ['年', '庚', '七杀', false, -1],
      ['月', '辛', '正官', false, -1],
    ])
    expect(result?.ganPoints).toBe(-2)
    expect(result?.correction).toBe(-1)
    expect(result?.correctionNote).toBe('月令得令但 子 本身无中气以上根 (-1)')
    expect(result?.score).toBe(0)
    expect(result?.level).toBe('身中(偏弱)')
  })

  test('失令且无根无助时判为身弱', () => {
    const result = analyzeStrength(pillars([
      ['庚', '申', '七杀'],
      ['戊', '辰', '偏财'],
      ['甲', '午', '日主'],
      ['辛', '酉', '正官'],
    ]))

    expect(result).not.toBeNull()
    expect(result?.deLing).toBe(false)
    expect(result?.deLingPoints).toBe(-3)
    expect(result?.rootPoints).toBe(0)
    expect(result?.ganPoints).toBe(-3)
    expect(result?.correction).toBe(0)
    expect(result?.score).toBe(-6)
    expect(result?.level).toBe('身弱')
  })
})
