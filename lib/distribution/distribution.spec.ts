import { describe, expect, test } from 'bun:test'
import { calculateBaziDistribution } from './index'

const input = {
  mode: 'trueSolar' as const,
  year: 2024,
  month: 2,
  day: 10,
  hour: 12,
  minute: 0,
  sex: 1 as const,
}

describe('calculateBaziDistribution', () => {
  test('3 小时步长上下 20 步产生 41 个曲线点', () => {
    const result = calculateBaziDistribution(input, 3, 20)

    expect(result.rangeHours).toBe(60)
    expect(result.samples).toHaveLength(41)
    expect(result.samples[0].offsetHours).toBe(-60)
    expect(result.samples[20].offsetHours).toBe(0)
    expect(result.samples[40].offsetHours).toBe(60)
    expect(result.samples[20].date).toEqual({ year: 2024, month: 2, day: 10, hour: 12, minute: 0 })
    expect(result.samples.every((sample) => sample.bazi.every((pillar) => pillar.length === 2))).toBe(true)
  })

  test('五行、旺衰和喜用统计均归一化', () => {
    const result = calculateBaziDistribution(input, 3, 20)
    const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

    expect(sum(result.summary.strengthLevels.map((item) => item.probability))).toBeCloseTo(1, 12)
    expect(sum(result.summary.primaryWuxing.map((item) => item.probability))).toBeCloseTo(1, 12)
    expect(sum(result.summary.secondaryWuxing.map((item) => item.probability))).toBeCloseTo(1, 12)
    expect(sum(Object.values(result.summary.averageWuxingProportion))).toBeCloseTo(1, 12)
    expect(sum(Object.values(result.summary.dominantWuxingProbability))).toBeCloseTo(1, 12)
    expect(result.samples.every((sample) => Number.isFinite(sample.strengthScore))).toBe(true)
  })

  test('拒绝无效步长和日期', () => {
    expect(() => calculateBaziDistribution(input, 0, 20)).toThrow(RangeError)
    expect(() => calculateBaziDistribution({ ...input, day: 31, month: 2 }, 3, 20)).toThrow(RangeError)
  })
})
