import { describe, expect, test } from 'bun:test'
import type { ExtendedDetailedPillar } from '@LIB'
import { formatBaziCopyText, normalizeAnalysisText } from './baziCopy'

const pillar = (
  label: string,
  gan: string,
  zhi: string,
  overrides: Partial<ExtendedDetailedPillar> = {},
): ExtendedDetailedPillar => ({
  label,
  gan: { name: gan, wuxing: '木', shishen: '比肩' },
  zhi: { name: zhi, wuxing: '水', cangGan: [] },
  nayin: '海中金',
  shensha: ['天乙贵人', '天乙贵人'],
  changsheng: '沐浴',
  shishen: '比肩',
  shishenWuxing: '木',
  ganWuxing: '木',
  zhiWuxing: '水',
  hideGans: ['癸'],
  hideShishen: ['正印'],
  hideShishenWuxings: ['水'],
  zizuo: '沐浴',
  ...overrides,
} as ExtendedDetailedPillar)

describe('formatBaziCopyText', () => {
  test('formats metadata and chart rows for pasting', () => {
    const text = formatBaziCopyText({
      solar: '2026-08-09 08:00',
      trueSolar: '2026-08-09 07:48',
      lunar: '丙午年六月廿七',
      pillars: [pillar('年柱', '甲', '子'), pillar('月柱', '乙', '丑')],
    })

    expect(text).toContain('公历：2026-08-09 08:00')
    expect(text).toContain('四柱\t年柱\t月柱')
    expect(text).toContain('干支\t甲子\t乙丑')
    expect(text).toContain('藏干\t癸(正印)\t癸(正印)')
    expect(text).toContain('神煞\t天乙贵人\t天乙贵人')
  })

  test('omits empty metadata and marks an unknown pillar', () => {
    const text = formatBaziCopyText({
      solar: '',
      trueSolar: '',
      lunar: '',
      pillars: [pillar('时柱', '', '', {
        shishen: '',
        hideGans: [],
        hideShishen: [],
        nayin: '',
        zizuo: '',
        shensha: [],
      })],
    })

    expect(text).not.toContain('公历：')
    expect(text).toContain('干支\t—')
    expect(text).toContain('神煞\t—')
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
