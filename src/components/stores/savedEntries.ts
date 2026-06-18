import { create } from 'zustand'
import { HOUR_UNKNOWN } from '@/lib'
import type { BaziInputData } from './compute'
import { computeFromState } from './compute'

export interface SavedEntry {
  name: string
  mode: 'bazi'
  bazi: [string, string, string, string]
  sex: 0 | 1
  savedAt: number
}

export const DEFAULT_STORAGE_KEY = 'bazi.saved.v1'

function convertPreset(year: number, month: number, day: number, hour: number, minute: number, sex: 0 | 1, name: string): SavedEntry {
  const temp: BaziInputData = {
    mode: 'gregorian',
    year, month, day, hour, minute,
    sex,
    bazi: ['', '', '', ''],
  }
  const computed = computeFromState(temp)
  const bazi: [string, string, string, string] = computed
    ? (computed.bazi.pillars.map((p) => `${p.gan}${p.zhi}`) as [string, string, string, string])
    : ['甲子', '甲子', '甲子', '甲子']
  return { name, mode: 'bazi', bazi, sex, savedAt: 0 }
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

function loadAll(storageKey: string): SavedEntry[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedEntry[]) : []
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
  return {
    ...current,
    mode: 'bazi',
    bazi: entry.bazi,
    sex: entry.sex,
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
