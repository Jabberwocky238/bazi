import { describe, expect, test } from 'bun:test'
import { Calculator, BaziInputC, type Gan, type Zhi } from '@jabberwocky238/bazi-engine'
import { computeShishenView } from 'bazilib'
import { formatBaziCopyText, normalizeAnalysisText } from './baziCopy'

/**
 * 用真实 Calculator 造柱 —— DetailedPillar 持 GanC/ZhiC 值对象, 无法字面量伪造;
 * 十神由 computeShishenView 现场算 (engine 1.1.0 起十神不挂在柱上)。
 */
function chart(gz: Array<[string, string]>) {
  const p = (i: number) => {
    const g = gz[i]
    return g ? { gan: g[0] as Gan, zhi: g[1] as Zhi } : undefined
  }
  const year = p(0), month = p(1), day = p(2)
  if (!year || !month || !day) throw new Error('年/月/日柱必填')
  // 1.2.0: Calculator 收 BaziInputC
  const pillars = new Calculator(BaziInputC.from({ year, month, day, hour: p(3), sex: 1 })).pillars()
  return { pillars, shishen: computeShishenView(pillars) }
}

describe('formatBaziCopyText', () => {
  test('formats metadata and chart rows for pasting', () => {
    const text = formatBaziCopyText({
      solar: '2026-08-09 08:00',
      trueSolar: '2026-08-09 07:48',
      lunar: '丙午年六月廿七',
      ...chart([['甲', '子'], ['乙', '丑'], ['丙', '寅'], ['丁', '卯']]),
    })

    expect(text).toContain('公历：2026-08-09 08:00')
    expect(text).toContain('四柱\t年柱\t月柱\t日柱\t时柱')
    expect(text).toContain('干支\t甲子\t乙丑\t丙寅\t丁卯')
    // 日柱天干记「日主」, 其余按日主 丙 定十神
    expect(text).toContain('十神\t偏印\t正印\t日主\t劫财')
    // 藏干带十神 (子 → 癸, 对丙为正官)
    expect(text).toContain('癸(正官)')
  })

  test('omits empty metadata and renders a three-pillar chart', () => {
    // 时辰未知 → engine 只产 3 柱 (不再有空占位柱)
    const text = formatBaziCopyText({
      solar: '',
      trueSolar: '',
      lunar: '',
      ...chart([['甲', '子'], ['乙', '丑'], ['丙', '寅']]),
    })

    expect(text).not.toContain('公历：')
    expect(text).toContain('四柱\t年柱\t月柱\t日柱')
    expect(text).not.toContain('时柱')
    expect(text).toContain('干支\t甲子\t乙丑\t丙寅')
  })
})

describe('normalizeAnalysisText', () => {
  test('removes interface hints while preserving analysis', () => {
    const text = normalizeAnalysisText(`
      ▸
      五行 · 十神 占比
      点击展开

      身强弱分析
      12 项 · 点击收起
      身略弱
    `)

    expect(text).toBe('五行 · 十神 占比\n身强弱分析\n身略弱')
  })
})
