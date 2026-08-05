import type { Sex, WuXing } from '@jabberwocky238/bazi-engine'
import type { BaziInputData, BaziInputMode } from '../compute'
import { computeFromState, deriveAll } from '../compute'
import type { StrengthLevel } from '../strength'
import { countWxStrength } from '../xiyong/tongguan'

export * from './calendar'

const WUXING = ['木', '火', '土', '金', '水'] as const satisfies readonly WuXing[]
const NONE = '无' as const

export interface BaziDistributionInput {
  /** 仅支持有明确时间的公历或真太阳时输入。 */
  mode: Exclude<BaziInputMode, 'bazi'>
  year: number
  month: number
  day: number
  hour: number
  minute: number
  longitude?: number
  sex: Sex
}

export interface BaziDistributionSample {
  /** 相对中心八字的小时差，可直接作为曲线横轴。 */
  offsetHours: number
  date: { year: number; month: number; day: number; hour: number; minute: number }
  bazi: [string, string, string, string]
  wuxingStrength: Record<WuXing, number>
  wuxingProportion: Record<WuXing, number>
  strengthScore: number
  strengthLevel: StrengthLevel
  primaryWuxing: WuXing | null
  secondaryWuxing: WuXing | null
}

export interface ProbabilityItem<T extends string> {
  value: T
  count: number
  probability: number
}

export interface BaziDistributionSummary {
  sampleCount: number
  strengthLevels: ProbabilityItem<StrengthLevel>[]
  primaryWuxing: ProbabilityItem<WuXing | typeof NONE>[]
  secondaryWuxing: ProbabilityItem<WuXing | typeof NONE>[]
  averageWuxingStrength: Record<WuXing, number>
  averageWuxingProportion: Record<WuXing, number>
  /** 每个样本最旺五行的概率；并列时均分该样本的权重。 */
  dominantWuxingProbability: Record<WuXing, number>
}

export interface BaziDistribution {
  paceHours: number
  steps: number
  rangeHours: number
  samples: BaziDistributionSample[]
  summary: BaziDistributionSummary
}

function assertInput(input: BaziDistributionInput, paceHours: number, steps: number): void {
  if (input.mode !== 'gregorian' && input.mode !== 'trueSolar') {
    throw new RangeError('distribution requires a gregorian or trueSolar input')
  }
  if (!Number.isFinite(paceHours) || paceHours <= 0) {
    throw new RangeError('paceHours must be greater than 0')
  }
  if (!Number.isSafeInteger(steps) || steps < 0) {
    throw new RangeError('steps must be a non-negative safe integer')
  }
  if (!Number.isInteger(input.hour) || input.hour < 0 || input.hour > 23) {
    throw new RangeError('hour must be an integer between 0 and 23')
  }
  if (!Number.isInteger(input.minute) || input.minute < 0 || input.minute > 59) {
    throw new RangeError('minute must be an integer between 0 and 59')
  }
  const date = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute))
  if (date.getUTCFullYear() !== input.year
    || date.getUTCMonth() !== input.month - 1
    || date.getUTCDate() !== input.day) {
    throw new RangeError('input date is invalid')
  }
}

/** 用 UTC 字段做纯历法加减，避免运行环境的夏令时改变采样间隔。 */
function shiftDate(input: BaziDistributionInput, offsetHours: number) {
  const date = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute))
  date.setTime(date.getTime() + offsetHours * 60 * 60 * 1000)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
  }
}

function emptyWuxing(): Record<WuXing, number> {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
}

function probabilities<T extends string>(values: T[]): ProbabilityItem<T>[] {
  const counts = new Map<T, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count, probability: count / values.length }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'zh-CN'))
}

export function summarizeBaziDistribution(samples: BaziDistributionSample[]): BaziDistributionSummary {
  const averageWuxingStrength = emptyWuxing()
  const averageWuxingProportion = emptyWuxing()
  const dominantWuxingProbability = emptyWuxing()

  for (const sample of samples) {
    for (const wx of WUXING) {
      averageWuxingStrength[wx] += sample.wuxingStrength[wx] / samples.length
      averageWuxingProportion[wx] += sample.wuxingProportion[wx] / samples.length
    }
    const max = Math.max(...WUXING.map((wx) => sample.wuxingStrength[wx]))
    const dominant = WUXING.filter((wx) => sample.wuxingStrength[wx] === max)
    for (const wx of dominant) dominantWuxingProbability[wx] += 1 / dominant.length / samples.length
  }

  return {
    sampleCount: samples.length,
    strengthLevels: probabilities(samples.map((sample) => sample.strengthLevel)),
    primaryWuxing: probabilities(samples.map((sample) => sample.primaryWuxing ?? NONE)),
    secondaryWuxing: probabilities(samples.map((sample) => sample.secondaryWuxing ?? NONE)),
    averageWuxingStrength,
    averageWuxingProportion,
    dominantWuxingProbability,
  }
}

/**
 * 以输入时间为中心，按小时步长计算上下 steps 步八字及概率分布。
 * paceHours=3、steps=20 时，范围为 [-60h, +60h]，共返回 41 个样本。
 */
export function calculateBaziDistribution(
  input: BaziDistributionInput,
  paceHours: number,
  steps: number,
): BaziDistribution {
  assertInput(input, paceHours, steps)
  const samples: BaziDistributionSample[] = []

  for (let step = -steps; step <= steps; step += 1) {
    const offsetHours = step * paceHours
    const date = shiftDate(input, offsetHours)
    const state: BaziInputData = {
      ...input,
      ...date,
      bazi: ['', '', '', ''],
    }
    const computed = computeFromState(state)
    if (!computed) throw new Error(`failed to compute bazi at offset ${offsetHours}h`)
    const derived = deriveAll(computed.bazi)
    if (!derived.analysis || !derived.xiyongAnalysis) {
      throw new Error(`failed to derive bazi at offset ${offsetHours}h`)
    }

    const wuxingStrength = countWxStrength(computed.bazi.pillars)
    const total = WUXING.reduce((sum, wx) => sum + wuxingStrength[wx], 0)
    const wuxingProportion = Object.fromEntries(
      WUXING.map((wx) => [wx, total === 0 ? 0 : wuxingStrength[wx] / total]),
    ) as Record<WuXing, number>
    const bazi = computed.bazi.pillars.map((pillar) => `${pillar.gan.name}${pillar.zhi.name}`)

    samples.push({
      offsetHours,
      date,
      bazi: bazi as [string, string, string, string],
      wuxingStrength,
      wuxingProportion,
      strengthScore: derived.analysis.score,
      strengthLevel: derived.analysis.level,
      primaryWuxing: derived.xiyongAnalysis.primaryWx,
      secondaryWuxing: derived.xiyongAnalysis.secondaryWx,
    })
  }

  return {
    paceHours,
    steps,
    rangeHours: paceHours * steps,
    samples,
    summary: summarizeBaziDistribution(samples),
  }
}
