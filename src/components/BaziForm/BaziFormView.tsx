import { useEffect, useState, type ReactNode } from 'react'
import { HOUR_UNKNOWN } from '@/lib'
import type { BaziInputMode } from '@@/stores'
import type { BaziInputData } from '@@/stores/compute'
import { SaveLoadControls, applySavedEntry, type SavedEntry } from './SaveLoadControls'

/**
 * 通用 八字输入面板 — 4-tab UI (公历 / 真太阳时 / 公历+经度 / 八字直输).
 *
 * API 极简化:
 *   - state: 当前完整 BaziInputData (主盘 ← useBaziInput, 合盘 ← useState)
 *   - onChange: 唯一状态写入通道 — 任意 mode/字段/八字 改动都汇成 next 一次性 emit
 *   - onSubmitted: 排盘按钮按下后触发 (主盘用于 syncToUrl)
 *
 *  整个流程的本质就是算八字: 输入 → state.bazi (4 干支) + sex 落定 → 后面交给 computeFromState.
 */
export interface BaziFormViewProps {
  state: BaziInputData
  onChange: (next: BaziInputData) => void
  /** 排盘 / 加载 / mode 切换 之后触发 (主盘 syncToUrl, 合盘可省). */
  onSubmitted?: () => void
  /**
   * 保存 / 加载 配置 — 提供则面板自动渲染保存/加载/清空 三个按钮 + 加载弹窗.
   * storageKey 默认 'bazi.saved.v1' (主盘 / 合盘 共用一份命例库). presets 仅主盘传.
   */
  saveLoad?: {
    storageKey?: string
    presets?: SavedEntry[]
    /** 紧凑按钮 (合盘场景). */
    compact?: boolean
  }
  /** 额外尾部插槽 (在排盘按钮之后, 保存/加载之前). */
  trailing?: ReactNode
  /** 在表单首字段前插入 (合盘可放 姓名 输入). */
  leading?: ReactNode
}

const TABS: { key: BaziInputMode; label: string; desc: string }[] = [
  { key: 'gregorian',     label: '公历', desc: '常规出生时间' },
  { key: 'trueSolar',     label: '真太阳时', desc: '已校正时间' },
  { key: 'gregorianLong', label: '公历 + 经度', desc: '按出生地修正' },
  { key: 'bazi',          label: '八字直输', desc: '直接输入四柱' },
]

const fieldShell =
  'group rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 shadow-sm transition ' +
  'focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/15 ' +
  'dark:border-slate-800 dark:bg-slate-950/40'
const fieldLabel = 'mb-1 block text-[10px] font-medium tracking-[0.22em] text-slate-400 dark:text-slate-500'
const fieldInput =
  'w-full bg-transparent text-base font-semibold tabular-nums text-slate-900 outline-none ' +
  'placeholder:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40 ' +
  'dark:text-slate-100 dark:placeholder:text-slate-700'
const hintCls = 'text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed'
const primaryBtn =
  'inline-flex items-center justify-center rounded-xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white ' +
  'shadow-sm transition hover:bg-amber-600 active:scale-[0.99]'
const GAN_CHARS = '甲乙丙丁戊己庚辛壬癸'
const ZHI_CHARS = '子丑寅卯辰巳午未申酉戌亥'

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

function leadingWithCard(leading: ReactNode) {
  if (!leading) return null
  return <div className="contents [&_label]:rounded-xl [&_label]:border [&_label]:border-slate-200 [&_label]:bg-white/70 [&_label]:px-3 [&_label]:py-2.5 [&_label]:shadow-sm dark:[&_label]:border-slate-800 dark:[&_label]:bg-slate-950/40">{leading}</div>
}

export function BaziFormView({
  state, onChange, onSubmitted, saveLoad, trailing, leading,
}: BaziFormViewProps) {
  const { mode, year, month, day, hour, minute, longitude, bazi, sex } = state
  const [hourUnknown, setHourUnknown] = useState(hour === HOUR_UNKNOWN)

  useEffect(() => {
    setHourUnknown(hour === HOUR_UNKNOWN)
  }, [hour])

  const setMode = (m: BaziInputMode) => onChange({ ...state, mode: m })

  const saveLoadEl = saveLoad ? (
    <SaveLoadControls
      current={state}
      onLoad={(e) => {
        const next = applySavedEntry(state, e)
        onChange(next)
        onSubmitted?.()
      }}
      storageKey={saveLoad.storageKey}
      presets={saveLoad.presets}
      compact={saveLoad.compact}
    />
  ) : null

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
    onChange({
      ...state,
      year: y,
      month: m,
      day: d,
      hour: nextHour,
      minute: hourUnknown ? 0 : Number(f.get('minute')),
      longitude: mode === 'gregorianLong' ? Number(f.get('lng')) : state.longitude,
      sex: Number(f.get('sex')) === 0 ? 0 : 1,
    })
    onSubmitted?.()
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
    if (parsed) {
      const sx = Number(f.get('sex')) === 0 ? 0 : 1
      onChange({ ...state, bazi: parsed, sex: sx })
      onSubmitted?.()
      return
    }
    if (y.length !== 2 || m.length !== 2 || d.length !== 2 || h.length !== 2) {
      alert('年/月/日/时 四柱必填, 各 2 字干支 (如 甲子)；也可在任意柱输入完整 8 字八字')
      return
    }
    const sx = Number(f.get('sex')) === 0 ? 0 : 1
    onChange({ ...state, bazi: [y, m, d, h], sex: sx })
    onSubmitted?.()
  }

  const hourInputValue = hour === HOUR_UNKNOWN ? 0 : hour

  return (
    <div className="relative z-30 mb-5 overflow-hidden rounded-3xl border border-slate-200 bg-white/75 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/75">
      <div className="grid grid-cols-2 gap-1.5 border-b border-slate-100 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-950/40 md:grid-cols-4">
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

      {mode === 'bazi' ? (
        <form
          key={`bazi-${bazi.join('|')}-${sex}`}
          onSubmit={onSubmitBazi}
          className="space-y-4 p-4 md:p-5"
        >
          <div className="grid gap-2 md:grid-cols-[repeat(4,minmax(0,1fr))_7rem]">
            {leadingWithCard(leading)}
            <Field label="年柱"><input name="bazi-y" defaultValue={bazi[0]} placeholder="甲子 / 8字" maxLength={16} onInput={onBaziInput} className={`${fieldInput} text-center tracking-[0.18em]`} /></Field>
            <Field label="月柱"><input name="bazi-m" defaultValue={bazi[1]} placeholder="甲子 / 8字" maxLength={16} onInput={onBaziInput} className={`${fieldInput} text-center tracking-[0.18em]`} /></Field>
            <Field label="日柱"><input name="bazi-d" defaultValue={bazi[2]} placeholder="甲子 / 8字" maxLength={16} onInput={onBaziInput} className={`${fieldInput} text-center tracking-[0.18em]`} /></Field>
            <Field label="时柱"><input name="bazi-h" defaultValue={bazi[3]} placeholder="甲子 / 8字" maxLength={16} onInput={onBaziInput} className={`${fieldInput} text-center tracking-[0.18em]`} /></Field>
            <Field label="性别"><select name="sex" defaultValue={sex} className={fieldInput}><option value={1}>男</option><option value={0}>女</option></select></Field>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="submit" className={primaryBtn}>排盘</button>
            {trailing}
            {saveLoadEl}
            <span className={`w-full ${hintCls}`}>
              八字直输模式: 年/月/日/时四柱必填；也可在任意柱粘贴完整 8 字八字（如 甲子乙丑丙寅丁卯）自动拆分；大运不可计算 (无日期)。
            </span>
          </div>
        </form>
      ) : (
        <form
          key={`${mode}-${year}-${month}-${day}-${hour}-${minute}-${longitude}-${sex}`}
          onSubmit={onSubmitGregorianLike}
          className="space-y-4 p-4 md:p-5"
        >
          <div className="grid gap-2 md:grid-cols-[1.15fr_0.75fr_0.75fr_0.75fr_0.75fr_7rem]">
            {leadingWithCard(leading)}
            <Field label="年份"><input name="year" type="number" defaultValue={year} className={fieldInput} /></Field>
            <Field label="月份"><input name="month" type="number" min={1} max={12} defaultValue={month} className={fieldInput} /></Field>
            <Field label="日期"><input name="day" type="number" min={1} max={31} defaultValue={day} className={fieldInput} /></Field>
            <Field label="小时"><input name="hour" type="number" min={0} max={23} defaultValue={hourInputValue} disabled={hourUnknown} className={fieldInput} /></Field>
            <Field label="分钟"><input name="minute" type="number" min={0} max={59} defaultValue={minute} disabled={hourUnknown} className={fieldInput} /></Field>
            <Field label="性别"><select name="sex" defaultValue={sex} className={fieldInput}><option value={1}>男</option><option value={0}>女</option></select></Field>
            {mode === 'gregorianLong' && (
              <Field label="出生地经度" className="md:col-span-2">
                <div className="flex items-baseline gap-2">
                  <input name="lng" type="number" step="0.01" min={-180} max={180} defaultValue={longitude} className={fieldInput} />
                  <span className="text-xs text-slate-400">°E</span>
                </div>
              </Field>
            )}
            <label className="flex min-h-[4.25rem] items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-400">
              <input
                type="checkbox"
                checked={hourUnknown}
                onChange={(e) => setHourUnknown(e.currentTarget.checked)}
                className="accent-amber-700"
              />
              <span>时柱未知</span>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="submit" className={primaryBtn}>排盘</button>
            {trailing}
            {saveLoadEl}
            {mode === 'trueSolar' && (
              <span className={`w-full ${hintCls}`}>
                真太阳时模式: 输入视作已修正的真太阳时, 时柱按输入时辰直接划分, 不再做均时差/经度修正。
              </span>
            )}
            {mode === 'gregorianLong' && (
              <span className={`w-full ${hintCls}`}>
                公历 + 经度: 自动应用均时差(仅太阳轨道) + 经度差 (与 120°E 差 1° = ±4 分钟) → 真太阳时, 再排时柱。
              </span>
            )}
            {mode === 'gregorian' && (
              <span className={`w-full ${hintCls}`}>
                公历模式: 直接以 wall clock 排盘 (现代多数算法), 真太阳时仅作参考显示。
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  )
}
