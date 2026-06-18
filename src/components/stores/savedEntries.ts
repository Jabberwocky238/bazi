import { create } from 'zustand'
import { HOUR_UNKNOWN } from '@/lib'
import type { BaziInputData } from './compute'

export interface SavedEntryBase {
  name: string
  sex: 0 | 1
  savedAt: number
}

/** 八字直输：仅存四柱干支。 */
export interface SavedBaziEntry extends SavedEntryBase {
  mode: 'bazi'
  bazi: [string, string, string, string]
}

/** 公历：存年月日时分 + 可选经度 (用于真太阳时校正)。 */
export interface SavedGregorianEntry extends SavedEntryBase {
  mode: 'gregorian'
  year: number
  month: number
  day: number
  hour: number
  minute: number
  longitude?: number
}

/** 真太阳时：存已校正后的年月日时分。 */
export interface SavedTrueSolarEntry extends SavedEntryBase {
  mode: 'trueSolar'
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

export type SavedEntry = SavedBaziEntry | SavedGregorianEntry | SavedTrueSolarEntry

export const DEFAULT_STORAGE_KEY = 'bazi.saved.v1'

function convertPreset(year: number, month: number, day: number, hour: number, minute: number, sex: 0 | 1, name: string): SavedGregorianEntry {
  return { name, mode: 'gregorian', year, month, day, hour, minute, sex, savedAt: 0 }
}

export const MAIN_PRESETS: SavedEntry[] = [
  convertPreset(1893, 12, 26, 7, 0, 1, '毛泽东'),
  convertPreset(1898, 3, 5, 6, 0, 1, '周恩来'),
  convertPreset(1930, 9, 7, 0, 0, 1, '袁隆平'),
  convertPreset(1835, 11, 29, 5, 0, 0, '慈禧'),
  convertPreset(1906, 2, 7, 12, 0, 1, '溥仪'),
  convertPreset(625, 3, 7, 0, 0, 0, '武则天'),
  convertPreset(1953, 6, 15, 12, 0, 1, 'XXX'),
  convertPreset(1984, 5, 18, HOUR_UNKNOWN, 0, 1, '张雪峰'),
  convertPreset(1958, 10, 9, 1, 0, 1, '许家印'),
  convertPreset(1940, 12, 18, 2, 13, 1, '雷锋'),
  convertPreset(1969, 12, 16, 8, 0, 1, '雷军'),
  convertPreset(1971, 10, 29, 8, 0, 1, '马化腾'),
]

/** 将任意来源 (含旧格式/损坏数据) 规整为合法 SavedEntry，无法识别的丢弃。 */
function normalizeEntry(raw: unknown): SavedEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  const name = typeof e.name === 'string' ? e.name : ''
  const sex: 0 | 1 = e.sex === 0 ? 0 : 1
  const savedAt = typeof e.savedAt === 'number' ? e.savedAt : 0
  if (!name) return null

  switch (e.mode) {
    case 'bazi': {
      const bazi = Array.isArray(e.bazi) ? (e.bazi as string[]).slice(0, 4) : []
      const filled: [string, string, string, string] = ['', '', '', '']
      bazi.forEach((g, i) => { filled[i] = typeof g === 'string' ? g : '' })
      return { name, sex, savedAt, mode: 'bazi', bazi: filled }
    }
    case 'gregorian':
    case 'trueSolar': {
      const num = (k: string, fallback = 0) => Number.isFinite(e[k] as number) ? (e[k] as number) : fallback
      const base = {
        name, sex, savedAt,
        mode: e.mode as 'gregorian' | 'trueSolar',
        year: num('year'), month: num('month'), day: num('day'),
        hour: num('hour', HOUR_UNKNOWN), minute: num('minute'),
      }
      return e.mode === 'gregorian'
        ? { ...base, longitude: Number.isFinite(e.longitude as number) ? (e.longitude as number) : undefined }
        : base
    }
    default:
      return null
  }
}

function loadAll(storageKey: string): SavedEntry[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeEntry).filter((e): e is SavedEntry => e !== null)
  } catch {
    return []
  }
}

function saveAll(storageKey: string, entries: SavedEntry[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries))
  } catch {}
}

function seededKey(storageKey: string): string {
  return `${storageKey}.seeded`
}

export function seedIfAbsent(storageKey: string, presets: SavedEntry[] | undefined): void {
  if (!presets || presets.length === 0) return
  const sk = seededKey(storageKey)
  try {
    const seeded = new Set<string>(JSON.parse(localStorage.getItem(sk) ?? '[]') as string[])
    const toAdd = presets.filter((p) => !seeded.has(p.name))
    if (!toAdd.length) return
    const existing = loadAll(storageKey)
    const existingNames = new Set(existing.map((e) => e.name))
    const newOnes = toAdd.filter((p) => !existingNames.has(p.name))
    if (newOnes.length) saveAll(storageKey, [...existing, ...newOnes])
    for (const p of toAdd) seeded.add(p.name)
    localStorage.setItem(sk, JSON.stringify([...seeded]))
  } catch {}
}

export function applySavedEntry(current: BaziInputData, entry: SavedEntry): BaziInputData {
  const base = { ...current, sex: entry.sex }
  switch (entry.mode) {
    case 'bazi':
      return { ...base, mode: 'bazi', bazi: entry.bazi }
    case 'gregorian':
      return {
        ...base,
        mode: 'gregorian',
        year: entry.year,
        month: entry.month,
        day: entry.day,
        hour: entry.hour,
        minute: entry.minute,
        longitude: entry.longitude,
      }
    case 'trueSolar':
      return {
        ...base,
        mode: 'trueSolar',
        year: entry.year,
        month: entry.month,
        day: entry.day,
        hour: entry.hour,
        minute: entry.minute,
      }
    default:
      return base
  }
}

/** 已存命例的展示摘要：按存储类型给出标签 + 详情。对异常/旧格式数据兜底，避免渲染崩溃。 */
export function describeEntry(entry: SavedEntry): { tag: string; detail: string } {
  switch (entry.mode) {
    case 'bazi': {
      const arr = Array.isArray(entry.bazi) ? entry.bazi : []
      return {
        tag: '八字直输',
        detail: arr.filter((g) => g && g.length === 2).join(' '),
      }
    }
    case 'gregorian':
    case 'trueSolar': {
      const tag = entry.mode === 'gregorian' ? '公历' : '真太阳时'
      const hm = entry.hour === HOUR_UNKNOWN ? '时辰未知' : `${String(entry.hour ?? 0).padStart(2, '0')}:${String(entry.minute ?? 0).padStart(2, '0')}`
      return {
        tag,
        detail: `${entry.year}-${String(entry.month ?? 0).padStart(2, '0')}-${String(entry.day ?? 0).padStart(2, '0')} ${hm}`,
      }
    }
    default:
      return { tag: '未知', detail: '' }
  }
}

interface SavedEntriesState {
  storageKey: string
  entries: SavedEntry[]
  presets: SavedEntry[]
  init: (storageKey: string, presets: SavedEntry[]) => void
  save: (entry: SavedEntry) => void
  delete: (name: string) => void
  reset: () => void
}

export const useSavedEntries = create<SavedEntriesState>((set, get) => ({
  storageKey: DEFAULT_STORAGE_KEY,
  entries: [],
  presets: [],

  init: (storageKey: string, presets: SavedEntry[]) => {
    seedIfAbsent(storageKey, presets)
    set({ storageKey, presets, entries: loadAll(storageKey) })
  },

  save: (entry: SavedEntry) => {
    const { storageKey, entries } = get()
    const list = entries.filter((e) => e.name !== entry.name)
    list.unshift(entry)
    saveAll(storageKey, list)
    set({ entries: list })
  },

  delete: (name: string) => {
    const { storageKey, entries } = get()
    const list = entries.filter((e) => e.name !== name)
    saveAll(storageKey, list)
    set({ entries: list })
  },

  reset: () => {
    const { storageKey, presets } = get()
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`${storageKey}.seeded`)
    } catch {}
    seedIfAbsent(storageKey, presets)
    set({ entries: loadAll(storageKey) })
  },
}))
