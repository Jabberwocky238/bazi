import { create } from 'zustand'
import type { Sex } from '@jabberwocky238/bazi-engine'
import {
  deriveAll,
  EMPTY_RESULT,
  type StrengthDerived,
  type Pillar,
  type BaziResult,
  type XiyongAnalysis,
  type DeriveAllResult,
} from 'bazilib'
import { HOUR_UNKNOWN } from 'bazilib'
import { computeFromState, type BaziInputMode } from 'bazilib'
import { computeDaYun, useDayun } from './dayun'
import { evalGeju, type GejuExtras, type GejuResult } from './geju'

/**
 * 排盘输入模式:
 *   gregorian      公历 (默认): 直接以输入的 wall clock 喂引擎, 可选经度做真太阳时校正。
 *   trueSolar      真太阳时 (用户已自行修正): 输入即真太阳时, 引擎按真太阳时分时柱。
 *   bazi           八字直输: 4 干支 + 性别, 跳过公历/农历计算。
 */
export interface BaziInputState {
  mode: BaziInputMode
  year: number
  month: number
  day: number
  hour: number
  minute: number
  /** 出生地经度, 单位 °E (东经为正). 仅 gregorian 模式可选. */
  longitude?: number
  /** 4 干支字符串, 仅 bazi 模式用. 时柱可空串(代表未知)。 */
  bazi: [string, string, string, string]
  sex: Sex
  setMode: (m: BaziInputMode) => void
  setDate: (d: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    sex: Sex
  }) => void
  setLongitude: (n?: number) => void
  setBaziGz: (b: [string, string, string, string], sex: Sex) => void
  syncToUrl: () => void
}

function parseIntOr(value: string | null, fallback: number): number {
  if (value === null) return fallback
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}
function parseFloatOrUndefined(value: string | null): number | undefined {
  if (value === null || value === '') return undefined
  const n = parseFloat(value)
  return Number.isFinite(n) ? n : undefined
}

function readQuery() {
  const search = typeof window === 'undefined' ? '' : window.location.search
  const params = new URLSearchParams(search)
  const sexRaw = parseIntOr(params.get('sex'), 1)
  const hourRaw = params.get('hour')
  const hourUnknown = hourRaw === 'unknown' || hourRaw === String(HOUR_UNKNOWN)
  const hour = hourUnknown
    ? HOUR_UNKNOWN
    : hourRaw === null || hourRaw === ''
      ? 7
      : parseIntOr(hourRaw, 7)
  const modeRaw = params.get('mode') as BaziInputMode | null
  const mode: BaziInputMode =
    modeRaw === 'trueSolar' || modeRaw === 'bazi'
      ? modeRaw
      : 'gregorian'
  const baziRaw = params.get('bazi') ?? ''
  const baziArr = baziRaw.split('|')
  const bazi: [string, string, string, string] = [
    baziArr[0] ?? '',
    baziArr[1] ?? '',
    baziArr[2] ?? '',
    baziArr[3] ?? '',
  ]
  return {
    mode,
    year: parseIntOr(params.get('year'), 1893),
    month: parseIntOr(params.get('month'), 12),
    day: parseIntOr(params.get('day'), 26),
    hour,
    minute: hourUnknown ? 0 : parseIntOr(params.get('minute'), 0),
    longitude: parseFloatOrUndefined(params.get('lng')),
    bazi,
    sex: (sexRaw === 0 ? 0 : 1) as Sex,
  }
}

const initial = readQuery()

export const useBaziInput = create<BaziInputState>((set, get) => ({
  ...initial,
  setMode: (mode) => set({ mode }),
  setDate: (d) => set(d),
  setLongitude: (longitude) => set({ longitude }),
  setBaziGz: (bazi, sex) => set({ bazi, sex }),
  syncToUrl: () => {
    if (typeof window === 'undefined') return
    const { mode, year, month, day, hour, minute, sex, longitude, bazi } = get()
    const q = new URLSearchParams({ sex: String(sex) })
    if (mode !== 'gregorian') q.set('mode', mode)
    if (mode === 'bazi') {
      q.set('bazi', bazi.join('|'))
    } else {
      q.set('year', String(year))
      q.set('month', String(month))
      q.set('day', String(day))
      if (hour === HOUR_UNKNOWN) {
        q.set('hour', 'unknown')
      } else {
        q.set('hour', String(hour))
        q.set('minute', String(minute))
      }
      if (mode === 'gregorian' && longitude !== undefined) q.set('lng', String(longitude))
    }
    const next = `${window.location.pathname}?${q.toString()}`
    window.history.replaceState(null, '', next)
  },
}))

// ————————————————————————————————————————————————————————
// useBazi — 主排盘结果 store，持有 BaziResult + 所有派生数据
// ————————————————————————————————————————————————————————

interface BaziStore extends BaziResult, DeriveAllResult {
  gejuExtras: GejuExtras
  /** 格局求值结果 —— rule 全量判定表 + 格局命中。 */
  geju: GejuResult
  setResult: (r: BaziResult) => void
  setGejuExtras: (e: GejuExtras) => void
  clearGejuExtras: () => void
}

export const useBazi = create<BaziStore>((set, get) => ({
  ...EMPTY_RESULT,
  ...deriveAll(EMPTY_RESULT),
  gejuExtras: {},
  geju: evalGeju(EMPTY_RESULT.pillars, deriveAll(EMPTY_RESULT)),
  setResult: (r) => {
    const derived = deriveAll(r)
    set({ ...r, ...derived, geju: evalGeju(r.pillars, derived, get().gejuExtras) })
  },
  setGejuExtras: (e) => {
    const c = get()
    set({ gejuExtras: e, geju: evalGeju(c.pillars, c, e) })
  },
  clearGejuExtras: () => {
    const c = get()
    set({ gejuExtras: {}, geju: evalGeju(c.pillars, c, {}) })
  },
}))

// 大运计算依赖出生公历日期 (lunar-typescript 数节气定起运),
// 仅 gregorian / trueSolar 模式有 effectiveDate; bazi 直输无日期则无法排运。
function syncDayun(sex: Sex, effectiveDate: { year: number; month: number; day: number; hour: number; minute: number } | null) {
  const data = effectiveDate ? computeDaYun(effectiveDate.year, effectiveDate.month, effectiveDate.day, effectiveDate.hour, effectiveDate.minute, sex) : null
  useDayun.getState().setDayun(data)
}

// 输入变化 → 重新计算排盘 + 大运
useBaziInput.subscribe((s) => {
  const result = computeFromState(s)
  if (result) {
    useBazi.getState().setResult(result.bazi)
    syncDayun(s.sex, result.effectiveDate)
  }
})

// 初始计算
const initialResult = computeFromState(useBaziInput.getState())
if (initialResult) {
  useBazi.getState().setResult(initialResult.bazi)
  syncDayun(useBaziInput.getState().sex, initialResult.effectiveDate)
}
