import { create } from 'zustand'
import type { Sex } from '@jabberwocky238/bazi-engine'
import { HOUR_UNKNOWN } from '@/lib'

export interface BaziInputState {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  sex: Sex
  setDate: (d: {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    sex: Sex
  }) => void
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
  // 'unknown' / '-1' 表示时柱缺失；其余缺省值落到 7 点（默认"时辰已知"）
  const hourUnknown = hourRaw === 'unknown' || hourRaw === String(HOUR_UNKNOWN)
  const hour = hourUnknown
    ? HOUR_UNKNOWN
    : hourRaw === null || hourRaw === ''
      ? 7
      : parseIntOr(hourRaw, 7)
  return {
    year: parseIntOr(params.get('year'), 1893),
    month: parseIntOr(params.get('month'), 12),
    day: parseIntOr(params.get('day'), 26),
    hour,
    minute: hourUnknown ? 0 : parseIntOr(params.get('minute'), 0),
    sex: (sexRaw === 0 ? 0 : 1) as Sex,
  }
}

const initial = readQuery()

export const useBazi = create<BaziInputState>((set, get) => ({
  ...initial,
  setDate: ({ year, month, day, hour, minute, sex }) => {
    const hourKnown = hour !== HOUR_UNKNOWN
    set({
      year,
      month,
      day,
      hour,
      minute: hourKnown ? minute : 0,
      sex,
    })
  },
  syncToUrl: () => {
    const { year, month, day, hour, minute, sex } = get()
    const q = new URLSearchParams({
      year: String(year),
      month: String(month),
      day: String(day),
      sex: String(sex),
    })
    if (hour === HOUR_UNKNOWN) {
      q.set('hour', 'unknown')
    } else {
      q.set('hour', String(hour))
      q.set('minute', String(minute))
    }
    const next = `${window.location.pathname}?${q.toString()}`
    window.history.replaceState(null, '', next)
  },
}))
