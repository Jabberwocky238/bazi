import { useEffect, useRef, useState } from 'react'
import { useBaziStore } from '@/lib/store'

const STORAGE_KEY = 'bazi.saved.v1'
const SEEDED_KEY = 'bazi.saved.seeded'

interface SavedEntry {
  name: string
  year: number
  month: number
  day: number
  hour: number
  sex: 0 | 1
  savedAt: number
}

function loadAll(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedEntry[]) : []
  } catch {
    return []
  }
}

function saveAll(entries: SavedEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* quota exceeded or storage disabled — ignore */
  }
}

const PRESETS: SavedEntry[] = [
  { name: '毛泽东', year: 1893, month: 12, day: 26, hour: 7, sex: 1, savedAt: 0 },
  { name: '周恩来', year: 1898, month: 3, day: 5, hour: 6, sex: 1, savedAt: 0 },
  { name: '袁隆平', year: 1930, month: 9, day: 7, hour: 0, sex: 1, savedAt: 0 },
  { name: '慈禧', year: 1835, month: 11, day: 29, hour: 5, sex: 0, savedAt: 0 },
  { name: '溥仪', year: 1906, month: 2, day: 7, hour: 12, sex: 1, savedAt: 0 },
  { name: '武则天', year: 625, month: 3, day: 7, hour: 0, sex: 0, savedAt: 0 },
]

function seedIfAbsent() {
  try {
    const seeded = new Set<string>(
      JSON.parse(localStorage.getItem(SEEDED_KEY) ?? '[]') as string[]
    )
    const toAdd = PRESETS.filter((p) => !seeded.has(p.name))
    if (!toAdd.length) return
    const existing = loadAll()
    const existingNames = new Set(existing.map((e) => e.name))
    const newOnes = toAdd.filter((p) => !existingNames.has(p.name))
    if (newOnes.length) saveAll([...existing, ...newOnes])
    for (const p of toAdd) seeded.add(p.name)
    localStorage.setItem(SEEDED_KEY, JSON.stringify([...seeded]))
  } catch {
    /* ignore */
  }
}

const btnCls =
  'px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 ' +
  'bg-white dark:bg-slate-900 hover:border-amber-600 dark:hover:border-amber-400 ' +
  'transition-colors'

export function SaveLoadControls() {
  const year = useBaziStore((s) => s.year)
  const month = useBaziStore((s) => s.month)
  const day = useBaziStore((s) => s.day)
  const hour = useBaziStore((s) => s.hour)
  const sex = useBaziStore((s) => s.sex)
  const setDate = useBaziStore((s) => s.setDate)
  const syncToUrl = useBaziStore((s) => s.syncToUrl)

  const [entries, setEntries] = useState<SavedEntry[]>([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    seedIfAbsent()
    setEntries(loadAll())
  }, [])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  const onSave = () => {
    const raw = window.prompt('保存当前排盘，输入名称：', '')
    if (raw === null) return
    const name = raw.trim()
    if (!name) return
    const next: SavedEntry = { name, year, month, day, hour, sex, savedAt: Date.now() }
    const list = loadAll().filter((e) => e.name !== name)
    list.unshift(next)
    saveAll(list)
    setEntries(list)
  }

  const onToggleLoad = () => {
    setEntries(loadAll())
    setOpen((o) => !o)
  }

  const onPick = (e: SavedEntry) => {
    setDate({ year: e.year, month: e.month, day: e.day, hour: e.hour, sex: e.sex })
    syncToUrl()
    setOpen(false)
  }

  const onDelete = (name: string, ev: React.MouseEvent) => {
    ev.stopPropagation()
    if (!window.confirm(`删除 “${name}” ？`)) return
    const list = loadAll().filter((e) => e.name !== name)
    saveAll(list)
    setEntries(list)
  }

  const onReset = () => {
    if (!window.confirm('恢复出厂设置将清空你保存的全部排盘，仅保留内置命例，确定？')) return
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(SEEDED_KEY)
    } catch {
      /* ignore */
    }
    seedIfAbsent()
    setEntries(loadAll())
    setOpen(false)
  }

  return (
    <div className="relative flex items-center gap-2" ref={wrapRef}>
      <button type="button" onClick={onSave} className={btnCls}>保存</button>
      <button type="button" onClick={onToggleLoad} className={btnCls}>
        加载 <span className="text-xs">▾</span>
      </button>
      <button
        type="button"
        onClick={onReset}
        className={btnCls + ' text-slate-500 hover:text-red-600 hover:border-red-400 dark:hover:border-red-500'}
      >
        恢复出厂设置
      </button>

      {open && (
        <div className="absolute top-full right-0 md:left-0 md:right-auto mt-2 z-20 w-[min(22rem,calc(100vw-2rem))] max-h-80 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl">
          {entries.length === 0 ? (
            <div className="px-3 py-4 text-sm text-slate-500">暂无保存记录</div>
          ) : (
            entries.map((e) => (
              <div
                key={e.name}
                className="group flex items-stretch border-b last:border-b-0 border-slate-100 dark:border-slate-800"
              >
                <button
                  type="button"
                  onClick={() => onPick(e)}
                  className="flex-1 min-w-0 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {e.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {e.year}-{String(e.month).padStart(2, '0')}-{String(e.day).padStart(2, '0')}{' '}
                    {String(e.hour).padStart(2, '0')}:00 · {e.sex === 1 ? '男' : '女'}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={(ev) => onDelete(e.name, ev)}
                  aria-label={`删除 ${e.name}`}
                  className="px-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
