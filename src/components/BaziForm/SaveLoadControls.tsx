import { useEffect, useState, useRef } from 'react'
import { HOUR_UNKNOWN } from '@/lib'
import type { BaziInputMode } from '@@/stores'
import type { BaziInputData } from '@@/stores/compute'
import { computeFromState } from '@@/stores/compute'
import { CommonButton } from '@@/CommonButton'
import { useDialog } from '@@/DialogContext'
import { LoadDialog } from '@@/LoadDialog'

export interface SavedEntry {
  name: string
  mode: 'bazi'
  bazi: [string, string, string, string]
  sex: 0 | 1
  savedAt: number
}

export const DEFAULT_STORAGE_KEY = 'bazi.saved.v1'

export interface SaveLoadControlsProps {
  current: BaziInputData
  onLoad: (entry: SavedEntry) => void
  storageKey?: string
  presets?: SavedEntry[]
  compact?: boolean
  buttonsOnly?: boolean
  hideSave?: boolean
  hideReset?: boolean
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

function saveAll(storageKey: string, entries: SavedEntry[]): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries))
  } catch {
  }
}

function seededKey(storageKey: string): string {
  return `${storageKey}.seeded`
}

function seedIfAbsent(storageKey: string, presets: SavedEntry[] | undefined): void {
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
  } catch {
  }
}


export function SaveLoadControls({
  current, onLoad, storageKey = DEFAULT_STORAGE_KEY, presets, compact = false, buttonsOnly = false, hideSave = false, hideReset = false,
}: SaveLoadControlsProps) {
  const [entries, setEntries] = useState<SavedEntry[]>([])
  const { open } = useDialog()
  const entriesRef = useRef(entries)

  useEffect(() => {
    entriesRef.current = entries
  }, [entries])

  useEffect(() => {
    seedIfAbsent(storageKey, presets)
    setEntries(loadAll(storageKey))
  }, [storageKey, presets])

  const openDialog = () => {
    const currentEntries = loadAll(storageKey)
    setEntries(currentEntries)
    open((onClose) => (
      <LoadDialog
        open={true}
        onClose={onClose}
        entries={currentEntries}
        onLoad={onLoad}
        onDelete={(name: string, ev: React.MouseEvent) => {
          ev.stopPropagation()
          if (!window.confirm('删除"' + name + '"？')) return
          const list = loadAll(storageKey).filter((e) => e.name !== name)
          saveAll(storageKey, list)
          setEntries(list)
        }}
      />
    ))
  }

  const onSave = () => {
    const raw = window.prompt('保存当前排盘，输入名称：', '')
    if (raw === null) return
    const name = raw.trim()
    if (!name) return

    let baziToSave: [string, string, string, string] | undefined

    if (current.mode === 'bazi') {
      baziToSave = current.bazi
    } else {
      const computed = computeFromState(current)
      if (computed) {
        baziToSave = computed.bazi.pillars.map((p) => `${p.gan}${p.zhi}`) as [string, string, string, string]
      }
    }

    if (!baziToSave || !baziToSave.every((g) => g.length === 2)) {
      alert('无法保存：无效的八字')
      return
    }

    const entry: SavedEntry = {
      name,
      mode: 'bazi',
      bazi: baziToSave,
      sex: current.sex as 0 | 1,
      savedAt: Date.now(),
    }
    const list = loadAll(storageKey).filter((e) => e.name !== name)
    list.unshift(entry)
    saveAll(storageKey, list)
    setEntries(list)
  }


  const onReset = () => {
    if (!window.confirm('恢复出厂设置将清空你保存的全部排盘' + (presets?.length ? '，仅保留内置命例，确定？' : '？'))) return
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(seededKey(storageKey))
    } catch {
    }
    seedIfAbsent(storageKey, presets)
    setEntries(loadAll(storageKey))
  }

  const buttons = (
    <>
      {!hideSave && (
        <CommonButton
          onClick={onSave}
          width={compact ? '' : 'md:w-[12.5%] flex-1 md:flex-none'}
        >
          保存
        </CommonButton>
      )}
      <CommonButton
        onClick={openDialog}
        width={compact ? '' : (hideSave && hideReset ? 'w-1/2 md:w-[50%]' : (hideSave ? 'w-1/2 md:w-[25%]' : 'md:w-[12.5%] flex-1 md:flex-none'))}
      >
        加载
      </CommonButton>
      {!hideReset && (
        <CommonButton
          variant="danger"
          onClick={onReset}
          width={compact ? '' : 'md:w-[25%] flex-[2] md:flex-none'}
        >
          {compact ? '清空' : '恢复出厂设置'}
        </CommonButton>
      )}
    </>
  )

  if (buttonsOnly) {
    return <>{buttons}</>
  }

  return (
    <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
      {buttons}
    </div>
  )
}

export function applySavedEntry(current: BaziInputData, entry: SavedEntry): BaziInputData {
  return {
    ...current,
    mode: 'bazi',
    bazi: entry.bazi,
    sex: entry.sex,
  }
}

function convertPreset(year: number, month: number, day: number, hour: number, minute: number, sex: 0 | 1, name: string): SavedEntry {
  const temp: BaziInputData = {
    mode: 'gregorian',
    year, month, day, hour, minute,
    sex,
    bazi: ['', '', '', ''],
  }
  const computed = computeFromState(temp)
  const bazi = computed ? (computed.bazi.pillars.map((p) => `${p.gan}${p.zhi}`) as [string, string, string, string]) : ['甲子', '甲子', '甲子', '甲子']
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
