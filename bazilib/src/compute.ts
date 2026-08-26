/**
 * 公历 → 八字 与 干支 → 八字 的计算逻辑。
 * 直接使用 @jabberwocky238/bazi-engine 的 Calculator。
 */
import { Solar } from 'lunar-typescript'
import  {Calculator, BaziInputC, SolarTime, type DetailedPillar } from '@jabberwocky238/bazi-engine'
import {
  type BaziInput,
  type Gan,
  type Zhi,
  type Sex,
  type PillarType,
} from '@jabberwocky238/bazi-engine'
import {
  HOUR_UNKNOWN,
  EMPTY_RESULT,
  fillDerivedFields,
  type BaziResult,
} from './base'
import { deriveStrength, type StrengthDerived } from './strength'
import { analyzeXiyong, type XiyongAnalysis } from './xiyong'

// ————————————————————————————————————————————————————————
// 真太阳时 —— 均时差 / 经度修正 / 时区一律走 engine 的 SolarTime,
// 不再自维近似式 (SolarTime 内部用 ShouXingUtil 天文级数)。
// ————————————————————————————————————————————————————————

/** 均时差(分钟). 委托 engine SolarTime.equationOfTime. */
export function equationOfTime(year: number, month: number, day: number): number {
  return SolarTime.equationOfTime(Date.UTC(year, month - 1, day, 12, 0, 0))
}

/** 按 120°E (北京标准时中央经线) 只做均时差修正后的真太阳时字符串. */
function formatTrueSolar(year: number, month: number, day: number, hour: number, minute: number): string {
  const st = SolarTime.fromLocal(year, month, day, hour, minute, 0, { longitude: 120, tzOffset: 8 })
  return st.toString().slice(0, 16)
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

  const calc = new Calculator(BaziInputC.from(input))
  // 时辰未知时 engine 只产 3 柱; 不补占位柱 (ZhiC/GanC 无空值表示),
  // 下游一律按 pillars.length / hourKnown 判断时柱是否存在。
  const pillars = calc.pillars()

  return fillDerivedFields({
    dayInMonth: dayInMonthOf(lunar, year, month, day),
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

/**
 * 出生日距本月节令起点的天数, 节令当日记 1 —— 人元司令的输入。
 * 用 lunar-typescript 的 getPrevJie(true) 取当月起点之节 (含当天)。
 */
function dayInMonthOf(
  lunar: ReturnType<Solar['getLunar']>,
  year: number,
  month: number,
  day: number,
): number | undefined {
  try {
    const js = lunar.getPrevJie(true).getSolar()
    const from = Date.UTC(js.getYear(), js.getMonth() - 1, js.getDay())
    const to = Date.UTC(year, month - 1, day)
    const n = Math.floor((to - from) / 86400000) + 1
    return n >= 1 ? n : undefined
  } catch {
    return undefined
  }
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
    const calc = new Calculator(BaziInputC.from(input))
    const pillars = calc.pillars()
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
    // 经度修正 + 均时差 一并交给 SolarTime; 钟表时间按东八区解释。
    const st = SolarTime.fromLocal(year, month, day, hour, minute, 0, {
      longitude: s.longitude,
      tzOffset: 8,
    })
    solarStr = fmtDate(year, month, day, hour, minute)
    const t = st.trueSolarParts
    year = t.year
    month = t.month
    day = t.day
    hour = t.hour
    minute = t.minute
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

export function deriveAll(r: BaziResult) {
  const strengthDerived = deriveStrength(r.pillars, r.dayInMonth)
  const xiyongAnalysis = analyzeXiyong(r.pillars, r.shishen, strengthDerived.analysis)
  return { ...r, ...strengthDerived, xiyongAnalysis }
}

export type DeriveAllResult = ReturnType<typeof deriveAll>
