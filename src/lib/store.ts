import { create } from 'zustand'
import { Solar } from 'lunar-typescript'
import {
  computeShensha,
  computeShishen,
  type BaziInput,
  type Gan,
  type Zhi,
  type Sex,
} from '@jabberwocky238/bazi-engine'
import type { SkillCategory } from './skills'
import { ganWuxing, zhiWuxing, shishenWuxing } from './wuxing'

export interface Pillar {
  label: string
  gz: string
  gan: string
  zhi: string
  ganWuxing: string
  zhiWuxing: string
  wuxing: string
  nayin: string
  hideGans: string[]
  shishen: string
  shishenWuxing: string
  hideShishen: string[]
  hideShishenWuxings: string[]
  shensha: string[]
}

export interface BaziResult {
  solarStr: string
  lunarStr: string
  pillars: Pillar[]
  hourKnown: boolean
}

/** 时柱未知时的哨兵值，与 form / URL / localStorage 共用 */
export const HOUR_UNKNOWN = -1

export interface SkillFocus {
  category: SkillCategory
  name: string
  subtitle?: string
}

interface BaziState {
  year: number
  month: number
  day: number
  hour: number
  sex: Sex
  result: BaziResult
  focused: SkillFocus | null
  setDate: (d: { year: number; month: number; day: number; hour: number; sex: Sex }) => void
  setFocused: (f: SkillFocus | null) => void
  syncToUrl: () => void
}

function parseIntOr(value: string | null, fallback: number): number {
  if (value === null) return fallback
  const n = parseInt(value, 10)
  return Number.isFinite(n) ? n : fallback
}

function readQuery() {
  const params = new URLSearchParams(window.location.search)
  const sexRaw = parseIntOr(params.get('sex'), 1)
  const hourRaw = params.get('hour')
  const hour =
    hourRaw === null || hourRaw === '' || hourRaw === 'unknown'
      ? 7
      : parseIntOr(hourRaw, 7)
  return {
    year: parseIntOr(params.get('year'), 1893),
    month: parseIntOr(params.get('month'), 12),
    day: parseIntOr(params.get('day'), 26),
    hour,
    sex: (sexRaw === 0 ? 0 : 1) as Sex,
  }
}

const EMPTY_PILLAR: Pillar = {
  label: '时柱',
  gz: '',
  gan: '',
  zhi: '',
  ganWuxing: '',
  zhiWuxing: '',
  wuxing: '',
  nayin: '',
  hideGans: [],
  shishen: '',
  shishenWuxing: '',
  hideShishen: [],
  hideShishenWuxings: [],
  shensha: [],
}

function compute(year: number, month: number, day: number, hour: number, sex: Sex): BaziResult {
  const hourKnown = hour >= 0 && hour < 24
  // 调用 Solar 需要合法 hour；未知时借 0 点作为占位，后续丢弃时柱
  const safeHour = hourKnown ? hour : 0
  const solar = Solar.fromYmdHms(year, month, day, safeHour, 0, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  const input: BaziInput = {
    year: { gan: ec.getYearGan() as Gan, zhi: ec.getYearZhi() as Zhi },
    month: { gan: ec.getMonthGan() as Gan, zhi: ec.getMonthZhi() as Zhi },
    day: { gan: ec.getDayGan() as Gan, zhi: ec.getDayZhi() as Zhi },
    hour: { gan: ec.getTimeGan() as Gan, zhi: ec.getTimeZhi() as Zhi },
    sex,
  }
  const shensha = computeShensha(input)
  const shishen = computeShishen(input)

  const base = [
    { label: '年柱', gz: ec.getYear(), gan: input.year.gan, zhi: input.year.zhi, wuxing: ec.getYearWuXing(), nayin: ec.getYearNaYin(), hide: ec.getYearHideGan() },
    { label: '月柱', gz: ec.getMonth(), gan: input.month.gan, zhi: input.month.zhi, wuxing: ec.getMonthWuXing(), nayin: ec.getMonthNaYin(), hide: ec.getMonthHideGan() },
    { label: '日柱', gz: ec.getDay(), gan: input.day.gan, zhi: input.day.zhi, wuxing: ec.getDayWuXing(), nayin: ec.getDayNaYin(), hide: ec.getDayHideGan() },
    { label: '时柱', gz: ec.getTime(), gan: input.hour.gan, zhi: input.hour.zhi, wuxing: ec.getTimeWuXing(), nayin: ec.getTimeNaYin(), hide: ec.getTimeHideGan() },
  ] as const

  const ssKey = ['year', 'month', 'day', 'hour'] as const
  const dayGan = input.day.gan

  const pillars = base.map<Pillar>((p, i) => {
    const ss = shishen.十神[i]
    const hideSs = shishen.藏干十神[i]
    return {
      label: p.label,
      gz: p.gz,
      gan: p.gan,
      zhi: p.zhi,
      ganWuxing: ganWuxing(p.gan),
      zhiWuxing: zhiWuxing(p.zhi),
      wuxing: p.wuxing,
      nayin: p.nayin,
      hideGans: [...p.hide],
      shishen: ss,
      shishenWuxing: shishenWuxing(dayGan, ss),
      hideShishen: hideSs,
      hideShishenWuxings: hideSs.map((s) => shishenWuxing(dayGan, s)),
      shensha: shensha[ssKey[i]],
    }
  })

  if (!hourKnown) pillars[3] = EMPTY_PILLAR

  return {
    solarStr: hourKnown ? solar.toYmdHms() : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 时辰未知`,
    lunarStr: hourKnown
      ? `${lunar.toString()} ${lunar.getTimeZhi()}时`
      : `${lunar.toString()} 时辰未知`,
    pillars,
    hourKnown,
  }
}

const initial = readQuery()

export const useBaziStore = create<BaziState>((set, get) => ({
  ...initial,
  result: compute(initial.year, initial.month, initial.day, initial.hour, initial.sex),
  focused: null,
  setDate: ({ year, month, day, hour, sex }) => {
    set({ year, month, day, hour, sex, result: compute(year, month, day, hour, sex) })
  },
  setFocused: (f) => set({ focused: f }),
  syncToUrl: () => {
    const { year, month, day, hour, sex } = get()
    const q = new URLSearchParams({
      year: String(year),
      month: String(month),
      day: String(day),
      hour: String(hour),
      sex: String(sex),
    })
    const next = `${window.location.pathname}?${q.toString()}`
    window.history.replaceState(null, '', next)
  },
}))
