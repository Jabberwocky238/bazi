import { useState } from 'react'
import { HOUR_UNKNOWN } from '@/lib'
import { useBazi } from '@@/stores'
import { inputCls, labelCls, primaryBtn } from '@@/css'
import { SaveLoadControls } from '@@/SaveLoadControls'

/** 校验 Gregorian 日期合法（处理闰年 + 月天数 + 历元年份 < 100） */
function isValidDate(y: number, m: number, d: number): boolean {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false
  if (m < 1 || m > 12 || d < 1) return false
  const dt = new Date(0, 0, 1)
  dt.setFullYear(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

export function BaziForm() {
  const year = useBazi((s) => s.year)
  const month = useBazi((s) => s.month)
  const day = useBazi((s) => s.day)
  const hour = useBazi((s) => s.hour)
  const minute = useBazi((s) => s.minute)
  const sex = useBazi((s) => s.sex)
  const setDate = useBazi((s) => s.setDate)
  const syncToUrl = useBazi((s) => s.syncToUrl)

  const [hourUnknown, setHourUnknown] = useState(hour === HOUR_UNKNOWN)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const y = Number(f.get('year'))
    const m = Number(f.get('month'))
    const d = Number(f.get('day'))
    if (!isValidDate(y, m, d)) {
      alert(`参数有误：${y} 年 ${m} 月没有第 ${d} 天`)
      return
    }
    setDate({
      year: y,
      month: m,
      day: d,
      hour: hourUnknown ? HOUR_UNKNOWN : Number(f.get('hour')),
      minute: hourUnknown ? 0 : Number(f.get('minute')),
      sex: Number(f.get('sex')) === 0 ? 0 : 1,
    })
    syncToUrl()
  }

  const hourInputValue = hour === HOUR_UNKNOWN ? 0 : hour

  return (
    <form
      key={`${year}-${month}-${day}-${hour}-${minute}-${sex}`}
      onSubmit={onSubmit}
      className="relative z-30 mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm"
    >
      <label className={labelCls}>年<input name="year" type="number" defaultValue={year} className={inputCls} /></label>
      <label className={labelCls}>月<input name="month" type="number" min={1} max={12} defaultValue={month} className={inputCls} /></label>
      <label className={labelCls}>日<input name="day" type="number" min={1} max={31} defaultValue={day} className={inputCls} /></label>
      <label className={labelCls}>
        时
        <input
          name="hour"
          type="number"
          min={0}
          max={23}
          defaultValue={hourInputValue}
          disabled={hourUnknown}
          className={inputCls + (hourUnknown ? ' opacity-40 cursor-not-allowed' : '')}
        />
      </label>
      <label className={labelCls}>
        分
        <input
          name="minute"
          type="number"
          min={0}
          max={59}
          defaultValue={minute}
          disabled={hourUnknown}
          className={inputCls + (hourUnknown ? ' opacity-40 cursor-not-allowed' : '')}
        />
      </label>
      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 pb-2 select-none cursor-pointer">
        <input
          type="checkbox"
          checked={hourUnknown}
          onChange={(e) => setHourUnknown(e.currentTarget.checked)}
          className="accent-amber-700"
        />
        时柱未知
      </label>
      <label className={labelCls}>
        性别
        <select name="sex" defaultValue={sex} className={inputCls}>
          <option value={1}>男</option>
          <option value={0}>女</option>
        </select>
      </label>
      <button type="submit" className={primaryBtn}>排盘</button>
      <SaveLoadControls />
    </form>
  )
}
