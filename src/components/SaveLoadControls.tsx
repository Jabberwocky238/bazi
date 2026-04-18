import { useEffect, useRef, useState } from 'react'
import { useBaziStore, HOUR_UNKNOWN } from '@/lib/store'

const STORAGE_KEY = 'bazi.saved.v1'
const SEEDED_KEY = 'bazi.saved.seeded'

interface SavedEntry {
  name: string
  year: number
  month: number
  day: number
  hour: number
  /** 可选，老存档没有就当 0 */
  minute?: number
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
    /* ignore */
  }
}

const PRESETS: SavedEntry[] = [
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

function seedIfAbsent() {
  try {
    const seeded = new Set<string>(
      JSON.parse(localStorage.getItem(SEEDED_KEY) ?? '[]') as string[],
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
  const minute = useBaziStore((s) => s.minute)
  const sex = useBaziStore((s) => s.sex)
  const setDate = useBaziStore((s) => s.setDate)
  const syncToUrl = useBaziStore((s) => s.syncToUrl)

  const [entries, setEntries] = useState<SavedEntry[]>([])
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    seedIfAbsent()
    setEntries(loadAll())
  }, [])

  const openDialog = () => {
    setEntries(loadAll())
    dialogRef.current?.showModal()
  }
  const closeDialog = () => dialogRef.current?.close()

  const onSave = () => {
    const raw = window.prompt('保存当前排盘，输入名称：', '')
    if (raw === null) return
    const name = raw.trim()
    if (!name) return
    const list = loadAll().filter((e) => e.name !== name)
    list.unshift({ name, year, month, day, hour, minute, sex, savedAt: Date.now() })
    saveAll(list)
    setEntries(list)
  }

  const onPick = (e: SavedEntry) => {
    setDate({
      year: e.year,
      month: e.month,
      day: e.day,
      hour: e.hour,
      minute: e.minute ?? 0,
      sex: e.sex,
    })
    syncToUrl()
    closeDialog()
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
  }

  // 点击背景关闭
  const onDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) closeDialog()
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onSave} className={btnCls}>保存</button>
        <button type="button" onClick={openDialog} className={btnCls}>加载</button>
        <button
          type="button"
          onClick={onReset}
          className={btnCls + ' text-slate-500 hover:text-red-600 hover:border-red-400 dark:hover:border-red-500'}
        >
          恢复出厂设置
        </button>
      </div>

      <dialog
        ref={dialogRef}
        onClick={onDialogClick}
        className="m-auto w-[min(24rem,calc(100vw-1.5rem))] max-h-[80vh] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 text-inherit shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">已保存命例</h3>
          <button
            type="button"
            onClick={closeDialog}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl leading-none"
            aria-label="关闭"
          >
            ×
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {entries.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-500 text-center">暂无保存记录</div>
          ) : (
            entries.map((e) => (
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
                    {e.year}-{String(e.month).padStart(2, '0')}-{String(e.day).padStart(2, '0')}{' '}
                    {e.hour === HOUR_UNKNOWN
                      ? '时辰未知'
                      : `${String(e.hour).padStart(2, '0')}:${String(e.minute ?? 0).padStart(2, '0')}`}{' '}
                    · {e.sex === 1 ? '男' : '女'}
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
            ))
          )}
        </div>
      </dialog>
    </>
  )
}
