import { describe, expect, test } from 'bun:test'
import { calculateBaziCalendarDistribution } from './calendar'

const input = { mode: 'trueSolar' as const, year: 2024, month: 1, day: 31, hour: 12, minute: 0, sex: 1 as const }

describe('calculateBaziCalendarDistribution', () => {
  test('默认按自然月采样并钳制月末', () => {
    const result = calculateBaziCalendarDistribution(input, 1, 1)
    expect(result.samples.map((sample) => [sample.offset, sample.date])).toEqual([
      [-1, { year: 2023, month: 12, day: 31, hour: 12, minute: 0 }],
      [0, { year: 2024, month: 1, day: 31, hour: 12, minute: 0 }],
      [1, { year: 2024, month: 2, day: 29, hour: 12, minute: 0 }],
    ])
  })

  test('支持日和年作为采样单位', () => {
    expect(calculateBaziCalendarDistribution(input, 2, 2, 'day').samples.map((sample) => sample.offset)).toEqual([-4, -2, 0, 2, 4])
    expect(calculateBaziCalendarDistribution(input, 1, 1, 'year').samples[2].date.day).toBe(31)
  })
})
