import { useState, useEffect, type ReactNode } from 'react'
import { HOUR_UNKNOWN, type Sex, type BaziInputMode } from '@/lib'
import type { BaziInputData } from '@@/stores/compute'
import { CommonButton } from '@@/CommonButton'
import { useDialog } from '@@/Dialog'
import { LoadModal } from '@@/LoadModal'
import {
  useSavedEntries,
  type SavedEntry,
  applySavedEntry,
} from '@@/stores/savedEntries'

// ============ Types & Constants ============

const TABS: { key: BaziInputMode; label: string; desc: string }[] = [
  { key: 'gregorian', label: '公历', desc: '常规出生时间' },
  { key: 'trueSolar', label: '真太阳时', desc: '已校正时间' },
  { key: 'bazi', label: '八字直输', desc: '直接输入四柱' },
]

const fieldShell =
  'group rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 shadow-sm transition ' +
  'focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 ' +
  'dark:border-slate-800 dark:bg-slate-950/40'
const fieldLabel = 'mb-1 block text-[10px] font-medium tracking-[0.22em] text-slate-400 dark:text-slate-50'
const fieldInput =
  'w-full bg-transparent text-base font-semibold tabular-nums text-slate-900 outline-none ' +
  'placeholder:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40 ' +
  'dark:text-slate-100 dark:placeholder:text-slate-700'
const GAN_CHARS = '甲乙丙丁戊己庚辛壬癸'
const ZHI_CHARS = '子丑寅卯辰巳午未申酉戌亥'

// ============ Utils ============

function parseBaziText(raw: string): [string, string, string, string] | null {
  const text = raw.replace(/[\s,，、|｜/／-]/g, '').trim()
  if (text.length !== 8) return null
  const out: string[] = []
  for (let i = 0; i < 8; i += 2) {
    const gan = text[i]
    const zhi = text[i + 1]
    if (!gan || !zhi || !GAN_CHARS.includes(gan) || !ZHI_CHARS.includes(zhi)) return null
    out.push(`${gan}${zhi}`)
  }
  return out as [string, string, string, string]
}

function isValidDate(y: number, m: number, d: number): boolean {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false
  if (m < 1 || m > 12 || d < 1) return false
  const dt = new Date(0, 0, 1)
  dt.setFullYear(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

function Field({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`${fieldShell} ${className}`}>
      <span className={fieldLabel}>{label}</span>
      {children}
    </label>
  )
}

export interface BaziFormProps {
  state: BaziInputData
  onChange: (next: BaziInputData) => void
  onClickExec?: () => void
  buttons?: (state: BaziInputData, onChange: (next: BaziInputData) => void, onClickExec?: () => void) => ReactNode
  hideButtons?: boolean
}

export function BaziForm({
  state,
  onChange,
  onClickExec,
  buttons,
  hideButtons = false,
}: BaziFormProps) {
  const { mode, year, month, day, hour, minute, longitude, bazi, sex } = state
  const [hourUnknown, setHourUnknown] = useState(hour === HOUR_UNKNOWN)
  const { open } = useDialog()
  const { entries, save, delete: deleteEntry, reset } = useSavedEntries()

  useEffect(() => {
    setHourUnknown(hour === HOUR_UNKNOWN)
  }, [hour])

  const setMode = (m: BaziInputMode) => onChange({ ...state, mode: m })

  const onSubmitGregorianLike = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const y = Number(f.get('year'))
    const m = Number(f.get('month'))
    const d = Number(f.get('day'))
    if (!isValidDate(y, m, d)) {
      alert(`参数有误：${y} 年 ${m} 月没有第 ${d} 天`)
      return
    }
    const nextHour = hourUnknown ? HOUR_UNKNOWN : Number(f.get('hour'))
    const newState = {
      ...state,
      year: y,
      month: m,
      day: d,
      hour: nextHour,
      minute: hourUnknown ? 0 : Number(f.get('minute')),
      sex: (Number(f.get('sex')) === 0 ? 0 : 1) as Sex,
    }
    if (mode === 'gregorian') {
      const lngVal = f.get('lng')
      newState.longitude = lngVal ? Number(lngVal) : undefined
    }
    onChange(newState)
    onClickExec?.()
  }

  const onBaziInput = (e: React.FormEvent<HTMLInputElement>) => {
    const parsed = parseBaziText(e.currentTarget.value)
    if (!parsed) return
    onChange({ ...state, bazi: parsed })
  }

  const onSubmitBazi = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const gz = (k: string) => String(f.get(k) ?? '').trim()
    const y = gz('bazi-y'), m = gz('bazi-m'), d = gz('bazi-d'), h = gz('bazi-h')
    const parsed = parseBaziText(`${y}${m}${d}${h}`)
    const sx = Number(f.get('sex')) === 0 ? 0 : 1
    if (parsed) {
      onChange({ ...state, bazi: parsed, sex: sx })
    } else {
      if (y.length !== 2 || m.length !== 2 || d.length !== 2 || h.length !== 2) {
        alert('年/月/日/时 四柱必填, 各 2 字干支 (如 甲子)；也可在任意柱输入完整 8 字八字')
        return
      }
      onChange({ ...state, bazi: [y, m, d, h], sex: sx })
    }
    onClickExec?.()
  }

  const hourInputValue = hour === HOUR_UNKNOWN ? 0 : hour

  const handleSave = () => {
    const raw = window.prompt('保存当前排盘，输入名称：', '')
    if (raw === null) return
    const name = raw.trim()
    if (!name) return

    const common = { name, sex: state.sex as 0 | 1, savedAt: Date.now() }
    let entry: SavedEntry

    if (state.mode === 'bazi') {
      if (!state.bazi.every((g) => g.length === 2)) {
        alert('无法保存：无效的八字')
        return
      }
      entry = { ...common, mode: 'bazi', bazi: state.bazi }
    } else {
      if (!isValidDate(state.year, state.month, state.day)) {
        alert('无法保存：无效的日期')
        return
      }
      const fields = {
        year: state.year,
        month: state.month,
        day: state.day,
        hour: state.hour,
        minute: state.minute,
      }
      if (state.mode === 'gregorian') {
        entry = { ...common, mode: 'gregorian', ...fields, longitude: state.longitude }
      } else {
        entry = { ...common, mode: 'trueSolar', ...fields }
      }
    }

    save(entry)
  }

  const handleLoad = () => {
    open(
      (api) => (
        <LoadModal
          onClose={api.close}
          entries={entries}
          onLoad={(entry) => {
            onChange(applySavedEntry(state, entry))
            api.close()
          }}
          onDelete={(name: string, ev: React.MouseEvent) => {
            ev.stopPropagation()
            if (!window.confirm('删除"' + name + '"？')) return
            deleteEntry(name)
          }}
        />
      ),
      { title: '已保存命例' },
    )
  }

  const handleReset = () => {
    if (!window.confirm('恢复出厂设置将清空你保存的全部排盘，仅保留内置命例，确定？')) return
    reset()
  }

  const defaultButtons = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <CommonButton onClick={handleSave} width="flex-1">保存</CommonButton>
      <CommonButton onClick={handleLoad} width="flex-1">加载</CommonButton>
      <CommonButton variant="danger" onClick={handleReset} width="flex-2">恢复出厂设置</CommonButton>
      <CommonButton variant="primary" width="w-full md:w-auto md:flex-2" type="submit">排盘</CommonButton>
    </div>
  )

  const renderButtons = () => {
    if (hideButtons) return null
    if (buttons) {
      return buttons(state, onChange, onClickExec)
    }
    return defaultButtons()
  }

  // 八字直输模式表单
  const renderBaziForm = () => (
    <form
      key={`bazi-${bazi.join('|')}-${sex}`}
      onSubmit={onSubmitBazi}
      className="space-y-4 p-4 md:p-5"
    >
      <div className="space-y-2">
        {/* 第一行：年月日时柱 */}
        <div className="grid gap-2 grid-cols-[repeat(4,minmax(0,1fr))]">
          <Field label="年柱"><input name="bazi-y" defaultValue={bazi[0]} placeholder="甲子" maxLength={16} onInput={onBaziInput} className={`${fieldInput} text-center tracking-[0.18em]`} /></Field>
          <Field label="月柱"><input name="bazi-m" defaultValue={bazi[1]} placeholder="甲子" maxLength={16} onInput={onBaziInput} className={`${fieldInput} text-center tracking-[0.18em]`} /></Field>
          <Field label="日柱"><input name="bazi-d" defaultValue={bazi[2]} placeholder="甲子" maxLength={16} onInput={onBaziInput} className={`${fieldInput} text-center tracking-[0.18em]`} /></Field>
          <Field label="时柱"><input name="bazi-h" defaultValue={bazi[3]} placeholder="甲子" maxLength={16} onInput={onBaziInput} className={`${fieldInput} text-center tracking-[0.18em]`} /></Field>
        </div>
        {/* 第二行：性别 */}
        <div className="grid gap-2 grid-cols-[7rem]">
          <Field label="性别"><select name="sex" defaultValue={sex} className={fieldInput}><option value={1}>男</option><option value={0}>女</option></select></Field>
        </div>
      </div>
      {renderButtons()}
    </form>
  )

  // 公历/真太阳时模式表单
  const renderGregorianLikeForm = () => (
    <form
      key={`${mode}-${year}-${month}-${day}-${hour}-${minute}-${longitude}-${sex}`}
      onSubmit={onSubmitGregorianLike}
      className="space-y-4 p-4 md:p-5"
    >
      <div className="space-y-2">
        {/* 第一行：年月日时分 */}
        <div className="grid gap-2 grid-cols-[1.15fr_0.75fr_0.75fr_0.75fr_0.75fr]">
          <Field label="年份"><input name="year" type="number" defaultValue={year} className={fieldInput} /></Field>
          <Field label="月份"><input name="month" type="number" min={1} max={12} defaultValue={month} className={fieldInput} /></Field>
          <Field label="日期"><input name="day" type="number" min={1} max={31} defaultValue={day} className={fieldInput} /></Field>
          <Field label="小时"><input name="hour" type="number" min={0} max={23} defaultValue={hourInputValue} disabled={hourUnknown} className={fieldInput} /></Field>
          <Field label="分钟"><input name="minute" type="number" min={0} max={59} defaultValue={minute} disabled={hourUnknown} className={fieldInput} /></Field>
        </div>
        {/* 第二行：其他选项 */}
        <div className="grid gap-2 grid-cols-[7rem_1fr_1fr]">
          <Field label="性别"><select name="sex" defaultValue={sex} className={fieldInput}><option value={1}>男</option><option value={0}>女</option></select></Field>
          {mode === 'gregorian' && (
            <Field label="出生地经度">
              <div className="flex items-baseline gap-2">
                <input name="lng" type="number" step="0.01" min={-180} max={180} defaultValue={longitude || ''} placeholder="留空不校正" className={fieldInput} />
                <span className="text-xs text-slate-400">°E</span>
              </div>
            </Field>
          )}
          <label className="flex min-h-[4.25rem] items-center gap-2 rounded-md border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
            <input
              type="checkbox"
              checked={hourUnknown}
              onChange={(e) => setHourUnknown(e.currentTarget.checked)}
              className="accent-amber-700"
            />
            <span>时柱未知</span>
          </label>
        </div>
      </div>
      {renderButtons()}
    </form>
  )

  return (
    <div className="relative z-30 mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white/75 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/75">
      <div className="grid gap-1.5 border-b border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-950/40 grid-cols-3">
        {TABS.map((t) => {
          const active = mode === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setMode(t.key)}
              className={[
                'rounded-2xl px-3 py-2.5 text-left transition',
                active
                  ? 'bg-white text-amber-700 shadow-sm ring-1 ring-amber-500/25 dark:bg-slate-900 dark:text-amber-400'
                  : 'text-slate-500 hover:bg-white/70 hover:text-amber-700 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-amber-400',
              ].join(' ')}
            >
              <div className="text-sm font-semibold tracking-wide">{t.label}</div>
              <div className="mt-0.5 text-[10px] opacity-70">{t.desc}</div>
            </button>
          )
        })}
      </div>

      {mode === 'bazi' ? renderBaziForm() : renderGregorianLikeForm()}
    </div >
  )
}
