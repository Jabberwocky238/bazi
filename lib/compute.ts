/**
 * 公历 → 八字 与 干支 → 八字 的计算逻辑。
 * 直接使用 @jabberwocky238/bazi-engine 的 Calculator。
 */
import { Solar } from 'lunar-typescript'
import  {Calculator, type DetailedPillar } from '@jabberwocky238/bazi-engine'
import {
  type BaziInput,
  type Gan,
  type Zhi,
  type Sex,
  type PillarType,
} from '@jabberwocky238/bazi-engine'
import {
  HOUR_UNKNOWN,
  EMPTY_PILLAR,
  EMPTY_RESULT,
  fillDerivedFields,
  type BaziResult,
} from './base'
import { deriveStrength, type StrengthDerived } from './strength'
import { detectGejuWith, type GejuOutput } from './geju'
import { analyzeXiyong, type XiyongAnalysis } from './xiyong'

// ————————————————————————————————————————————————————————
// 真太阳时均时差修正 (按 120°E, 不含经度修正)
// ————————————————————————————————————————————————————————

function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1)
  const d = Date.UTC(year, month - 1, day)
  return Math.floor((d - start) / 86400000) + 1
}

/** 均时差(分钟). 公历→真太阳时使用. 仅靠太阳轨道, 不含经度修正. */
export function equationOfTime(year: number, month: number, day: number): number {
  const n = dayOfYear(year, month, day)
  const B = (2 * Math.PI * (n - 81)) / 365
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

function formatTrueSolar(year: number, month: number, day: number, hour: number, minute: number): string {
  const eot = equationOfTime(year, month, day)
  const d = new Date(year, month - 1, day, hour, minute, 0)
  d.setMinutes(d.getMinutes() + Math.round(eot))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${dd} ${hh}:${mm}`
}

// ————————————————————————————————————————————————————————
// computeBazi — 公历 + 性别 → BaziResult
// ————————————————————————————————————————————————————————

export function computeBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  sex: Sex,
): BaziResult {
  const hourKnown = hour !== HOUR_UNKNOWN && hour >= 0 && hour < 24
  const safeHour = hourKnown ? hour : 0
  const safeMinute = hourKnown && minute >= 0 && minute < 60 ? minute : 0
  const solar = Solar.fromYmdHms(year, month, day, safeHour, safeMinute, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  ec.setSect(1)

  const input: BaziInput = {
    year: { gan: ec.getYearGan() as Gan, zhi: ec.getYearZhi() as Zhi },
    month: { gan: ec.getMonthGan() as Gan, zhi: ec.getMonthZhi() as Zhi },
    day: { gan: ec.getDayGan() as Gan, zhi: ec.getDayZhi() as Zhi },
    hour: hourKnown ? { gan: ec.getTimeGan() as Gan, zhi: ec.getTimeZhi() as Zhi } : undefined,
    sex,
  }

  const calc = new Calculator(input)
  const pillars = calc.pillars()
  if (pillars.length === 3) pillars.push(EMPTY_PILLAR)

  return fillDerivedFields({
    solarStr: hourKnown
      ? solar.toYmdHms()
      : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 时辰未知`,
    trueSolarStr: hourKnown ? formatTrueSolar(year, month, day, hour, minute) : '',
    lunarStr: hourKnown
      ? `${lunar.toString()} ${lunar.getTimeZhi()}时`
      : `${lunar.toString()} 时辰未知`,
    pillars,
    hourKnown,
  })
}

// ————————————————————————————————————————————————————————
// 解析八字字符串 → BaziResult
// ————————————————————————————————————————————————————————

function parseGz(gz: string): { gan: Gan; zhi: Zhi } {
  if (gz.length !== 2) throw new Error(`bad ganzhi: ${gz}`)
  return { gan: gz[0] as Gan, zhi: gz[1] as Zhi }
}

export function parseBaziToResult(bazi: [string, string, string, string], sex: Sex): BaziResult {
  const [y, m, d, h] = bazi
  const hourKnown = h.length === 2
  try {
    const input: BaziInput = {
      year: parseGz(y),
      month: parseGz(m),
      day: parseGz(d),
      hour: hourKnown ? parseGz(h) : undefined,
      sex,
    }
    const calc = new Calculator(input)
    const pillars = calc.pillars()
    if (pillars.length === 3) pillars.push(EMPTY_PILLAR)
    return fillDerivedFields({
      solarStr: '',
      trueSolarStr: '',
      lunarStr: `八字直输 ${bazi.filter((g) => g.length === 2).join(' ')}`,
      pillars,
      hourKnown,
    })
  } catch (e) {
    console.warn('[bazi-mode] 解析失败:', e)
    return EMPTY_RESULT
  }
}

// ————————————————————————————————————————————————————————
// computeFromState — 输入 state 一站式返回 BaziResult
// ————————————————————————————————————————————————————————

export type BaziInputMode = 'gregorian' | 'trueSolar' | 'bazi'

export interface BaziInputData {
  mode: BaziInputMode
  year: number
  month: number
  day: number
  hour: number
  minute: number
  longitude?: number
  bazi: [string, string, string, string]
  sex: Sex
}

function fmtDate(y: number, m: number, d: number, h: number, mi: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(mi)}`
}

export interface ComputedFromState {
  bazi: BaziResult
  effectiveDate: { year: number; month: number; day: number; hour: number; minute: number } | null
}

export function computeFromState(s: BaziInputData): ComputedFromState | null {
  if (s.mode === 'bazi') {
    const bazi = Array.isArray(s.bazi) ? s.bazi : []
    const valid = bazi.slice(0, 3).every((g) => typeof g === 'string' && g.length === 2)
    if (!valid) return null
    return {
      bazi: parseBaziToResult(bazi as [string, string, string, string], s.sex),
      effectiveDate: null,
    }
  }

  let { year, month, day, hour, minute } = s
  let trueSolarStr = ''
  let solarStr = ''
  const hourKnown = hour !== HOUR_UNKNOWN && hour >= 0 && hour < 24

  if (s.mode === 'gregorian' && s.longitude !== undefined && hourKnown) {
    const eot = equationOfTime(year, month, day)
    const longShift = (s.longitude - 120) * 4
    const total = Math.round(eot + longShift)
    const d = new Date(year, month - 1, day, hour, minute, 0)
    d.setMinutes(d.getMinutes() + total)
    solarStr = fmtDate(year, month, day, hour, minute)
    year = d.getFullYear()
    month = d.getMonth() + 1
    day = d.getDate()
    hour = d.getHours()
    minute = d.getMinutes()
    trueSolarStr = fmtDate(year, month, day, hour, minute)
  } else if (s.mode === 'trueSolar' && hourKnown) {
    trueSolarStr = fmtDate(year, month, day, hour, minute)
  }

  const r = computeBazi(year, month, day, hour, minute, s.sex)
  if (s.mode === 'gregorian' && s.longitude !== undefined && solarStr) {
    r.solarStr = `${solarStr} (公历)`
    r.trueSolarStr = `${trueSolarStr} (真太阳时)`
  } else if (s.mode === 'trueSolar' && trueSolarStr) {
    r.trueSolarStr = `${trueSolarStr} (输入即真太阳时，未再做均时差)`
  }

  return {
    bazi: r,
    effectiveDate: { year, month, day, hour, minute },
  }
}

// ————————————————————————————————————————————————————————
// 一站式派生所有排盘数据
// ————————————————————————————————————————————————————————

export function deriveAll(r: BaziResult, gejuExtras: { dayun?: DetailedPillar; liunian?: DetailedPillar } = {}) {
  const strengthDerived = deriveStrength(r.pillars)
  const gejuHits = detectGejuWith(r, strengthDerived, gejuExtras)
  const xiyongAnalysis = analyzeXiyong(r.pillars, strengthDerived.analysis, gejuHits)
  return { ...r, ...strengthDerived, gejuHits, xiyongAnalysis }
}

export type DeriveAllResult = ReturnType<typeof deriveAll>
