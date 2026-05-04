import { useEffect, useState } from 'react'
import { HOUR_UNKNOWN } from '@/lib'
import type { BaziInputMode } from '@@/stores'
import type { BaziInputData } from '@@/stores/compute'
import { Dialog } from '@@/Dialog'

/**
 * Generic 保存 / 加载 控件 — 由 BaziFormView 内嵌, 主盘与合盘共用.
 *
 * 注入:
 *   current     当前 BaziInputData (BaziFormView 直接传 state)
 *   onLoad      用户选中条目时回调 — 接收完整 SavedEntry, 调用方按需 dispatch setters
 *   storageKey  localStorage 命名空间 (主盘 'bazi.saved.v1'; 合盘每人独立)
 *   presets     初始化用预设 (主盘传 12 名人; 合盘可空)
 *   compact     合盘紧凑模式 (按钮更小)
 */
export interface SavedEntry {
  name: string
  /** 模式; 老存档无 mode 字段, 默认 'gregorian'. */
  mode?: BaziInputMode
  year: number
  month: number
  day: number
  hour: number
  minute?: number
  /** 仅 gregorianLong 模式. */
  longitude?: number
  /** 仅 bazi 模式. */
  bazi?: [string, string, string, string]
  sex: 0 | 1
  savedAt: number
}

/** 全局共享 localStorage key — 主盘 / 合盘 共用一份命例库. */
export const DEFAULT_STORAGE_KEY = 'bazi.saved.v1'

export interface SaveLoadControlsProps {
  current: BaziInputData
  onLoad: (entry: SavedEntry) => void
  /** 默认 'bazi.saved.v1' (主盘合盘共用). */
  storageKey?: string
  presets?: SavedEntry[]
  compact?: boolean
}

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

function saveAll(storageKey: string, entries: SavedEntry[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries))
  } catch {
    /* ignore */
  }
}

function seededKey(storageKey: string): string {
  return `${storageKey}.seeded`
}

function seedIfAbsent(storageKey: string, presets: SavedEntry[] | undefined) {
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
  } catch { /* ignore */ }
}

const btnCls =
  'px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 ' +
  'bg-white dark:bg-slate-900 hover:border-amber-600 dark:hover:border-amber-400 ' +
  'transition-colors'
const btnClsCompact =
  'px-2 py-1 text-[11px] rounded-md border border-slate-300 dark:border-slate-700 ' +
  'bg-white dark:bg-slate-900 hover:border-amber-600 dark:hover:border-amber-400 ' +
  'transition-colors'

export function SaveLoadControls({
  current, onLoad, storageKey = DEFAULT_STORAGE_KEY, presets, compact = false,
}: SaveLoadControlsProps) {
  const [entries, setEntries] = useState<SavedEntry[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    seedIfAbsent(storageKey, presets)
    setEntries(loadAll(storageKey))
  }, [storageKey, presets])

  const openDialog = () => {
    setEntries(loadAll(storageKey))
    setDialogOpen(true)
  }
  const closeDialog = () => setDialogOpen(false)

  const onSave = () => {
    const raw = window.prompt('保存当前排盘，输入名称：', '')
    if (raw === null) return
    const name = raw.trim()
    if (!name) return
    const entry: SavedEntry = {
      name,
      mode: current.mode,
      year: current.year, month: current.month, day: current.day,
      hour: current.hour, minute: current.minute,
      longitude: current.mode === 'gregorianLong' ? current.longitude : undefined,
      bazi: current.mode === 'bazi' ? current.bazi : undefined,
      sex: current.sex as 0 | 1,
      savedAt: Date.now(),
    }
    const list = loadAll(storageKey).filter((e) => e.name !== name)
    list.unshift(entry)
    saveAll(storageKey, list)
    setEntries(list)
  }

  const onPick = (e: SavedEntry) => {
    onLoad(e)
    closeDialog()
  }

  const onDelete = (name: string, ev: React.MouseEvent) => {
    ev.stopPropagation()
    if (!window.confirm(`删除 “${name}” ？`)) return
    const list = loadAll(storageKey).filter((e) => e.name !== name)
    saveAll(storageKey, list)
    setEntries(list)
  }

  const onReset = () => {
    if (!window.confirm('恢复出厂设置将清空你保存的全部排盘' + (presets?.length ? '，仅保留内置命例，确定？' : '？'))) return
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(seededKey(storageKey))
    } catch { /* ignore */ }
    seedIfAbsent(storageKey, presets)
    setEntries(loadAll(storageKey))
  }

  const cls = compact ? btnClsCompact : btnCls

  return (
    <>
      <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
        <button type="button" onClick={onSave} className={cls}>保存</button>
        <button type="button" onClick={openDialog} className={cls}>加载</button>
        <button
          type="button"
          onClick={onReset}
          className={cls + ' text-slate-500 hover:text-red-600 hover:border-red-400 dark:hover:border-red-500'}
        >
          {compact ? '清空' : '恢复出厂设置'}
        </button>
      </div>

      <Dialog open={dialogOpen} onClose={closeDialog} title="已保存命例">
        {entries.length === 0 ? (
          <div className="py-6 text-sm text-slate-500 text-center">暂无保存记录</div>
        ) : (
          <div className="-mx-5">
            {entries.map((e) => (
              <div
                key={e.name}
                className="flex items-stretch border-b last:border-b-0 border-slate-100 dark:border-slate-800"
              >
                <button
                  type="button"
                  onClick={() => onPick(e)}
                  className="flex-1 min-w-0 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {e.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {e.mode === 'bazi' && e.bazi
                      ? `八字 ${e.bazi.filter((g) => g.length === 2).join(' ')}`
                      : <>
                          {e.year}-{String(e.month).padStart(2, '0')}-{String(e.day).padStart(2, '0')}{' '}
                          {e.hour === HOUR_UNKNOWN
                            ? '时辰未知'
                            : `${String(e.hour).padStart(2, '0')}:${String(e.minute ?? 0).padStart(2, '0')}`}
                          {e.mode === 'gregorianLong' && e.longitude != null && ` (${e.longitude}°E)`}
                        </>
                    }
                    {' · '}{e.sex === 1 ? '男' : '女'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(ev) => onDelete(e.name, ev)}
                  aria-label={`删除 ${e.name}`}
                  className="px-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </Dialog>
    </>
  )
}

/**
 * 把 SavedEntry 套用到当前 state 上, 返回新 state — 调用方一次性 onChange 即可.
 * 老存档无 mode 字段时回 'gregorian'.
 */
export function applySavedEntry(current: BaziInputData, entry: SavedEntry): BaziInputData {
  const mode: BaziInputMode = entry.mode ?? 'gregorian'
  return {
    ...current,
    mode,
    year: entry.year,
    month: entry.month,
    day: entry.day,
    hour: entry.hour,
    minute: entry.minute ?? 0,
    longitude: mode === 'gregorianLong' && entry.longitude != null ? entry.longitude : current.longitude,
    bazi: mode === 'bazi' && entry.bazi ? entry.bazi : current.bazi,
    sex: entry.sex,
  }
}

/** 主盘内置 12 名人预设 — 老存档默认 mode='gregorian'. */
export const MAIN_PRESETS: SavedEntry[] = [
  { name: '毛泽东', year: 1893, month: 12, day: 26, hour: 7, minute: 0, sex: 1, savedAt: 0 },
  { name: '周恩来', year: 1898, month: 3, day: 5, hour: 6, minute: 0, sex: 1, savedAt: 0 },
  { name: '袁隆平', year: 1930, month: 9, day: 7, hour: 0, minute: 0, sex: 1, savedAt: 0 },
  { name: '慈禧', year: 1835, month: 11, day: 29, hour: 5, minute: 0, sex: 0, savedAt: 0 },
  { name: '溥仪', year: 1906, month: 2, day: 7, hour: 12, minute: 0, sex: 1, savedAt: 0 },
  { name: '武则天', year: 625, month: 3, day: 7, hour: 0, minute: 0, sex: 0, savedAt: 0 },
  { name: 'XXX', year: 1953, month: 6, day: 15, hour: 12, minute: 0, sex: 1, savedAt: 0 },
  { name: '张雪峰', year: 1984, month: 5, day: 18, hour: HOUR_UNKNOWN, minute: 0, sex: 1, savedAt: 0 },
  { name: '许家印', year: 1958, month: 10, day: 9, hour: 1, minute: 0, sex: 1, savedAt: 0 },
  { name: '雷锋', year: 1940, month: 12, day: 18, hour: 2, minute: 13, sex: 1, savedAt: 0 },
  { name: '雷军', year: 1969, month: 12, day: 16, hour: 8, minute: 0, sex: 1, savedAt: 0 },
  { name: '马化腾', year: 1971, month: 10, day: 29, hour: 8, minute: 0, sex: 1, savedAt: 0 },
]
