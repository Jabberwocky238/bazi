import {
  calculateBaziDistribution,
  summarizeBaziDistribution,
  type BaziDistributionInput,
  type BaziDistributionSample,
  type BaziDistributionSummary,
} from './index'

export type SamplingUnit = 'month' | 'day' | 'year'

export interface CalendarDistributionSample extends BaziDistributionSample {
  /** 相对基准的采样单位数量。 */
  offset: number
}

export interface BaziCalendarDistribution {
  samplingUnit: SamplingUnit
  pace: number
  steps: number
  samples: CalendarDistributionSample[]
  summary: BaziDistributionSummary
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function shiftCalendar(input: BaziDistributionInput, amount: number, unit: SamplingUnit) {
  if (unit === 'day') {
    const date = new Date(Date.UTC(input.year, input.month - 1, input.day + amount, input.hour, input.minute))
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: date.getUTCHours(), minute: date.getUTCMinutes() }
  }

  const monthIndex = unit === 'month'
    ? input.year * 12 + input.month - 1 + amount
    : (input.year + amount) * 12 + input.month - 1
  const year = Math.floor(monthIndex / 12)
  const month = ((monthIndex % 12) + 12) % 12 + 1
  return {
    year,
    month,
    day: Math.min(input.day, daysInMonth(year, month)),
    hour: input.hour,
    minute: input.minute,
  }
}

/** 按自然日/月/年围绕一个时间基准采样八字分布。 */
export function calculateBaziCalendarDistribution(
  input: BaziDistributionInput,
  pace: number,
  steps: number,
  samplingUnit: SamplingUnit = 'month',
): BaziCalendarDistribution {
  if (!Number.isSafeInteger(pace) || pace <= 0) throw new RangeError('pace must be a positive safe integer')
  if (!Number.isSafeInteger(steps) || steps < 0) throw new RangeError('steps must be a non-negative safe integer')
  if (samplingUnit !== 'month' && samplingUnit !== 'day' && samplingUnit !== 'year') {
    throw new RangeError('samplingUnit must be month, day, or year')
  }

  const samples: CalendarDistributionSample[] = []
  for (let step = -steps; step <= steps; step += 1) {
    const offset = step * pace
    const date = shiftCalendar(input, offset, samplingUnit)
    const sample = calculateBaziDistribution({ ...input, ...date }, 1, 0).samples[0]
    samples.push({ ...sample, offset })
  }
  return { samplingUnit, pace, steps, samples, summary: summarizeBaziDistribution(samples) }
}
