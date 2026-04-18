import { useBaziStore } from '@/lib/store'
import { inputCls, labelCls, primaryBtn } from '@/lib/ui'
import { SaveLoadControls } from '@@/SaveLoadControls'

export function BaziForm() {
  const year = useBaziStore((s) => s.year)
  const month = useBaziStore((s) => s.month)
  const day = useBaziStore((s) => s.day)
  const hour = useBaziStore((s) => s.hour)
  const sex = useBaziStore((s) => s.sex)
  const setDate = useBaziStore((s) => s.setDate)
  const syncToUrl = useBaziStore((s) => s.syncToUrl)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setDate({
      year: Number(f.get('year')),
      month: Number(f.get('month')),
      day: Number(f.get('day')),
      hour: Number(f.get('hour')),
      sex: Number(f.get('sex')) === 0 ? 0 : 1,
    })
    syncToUrl()
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative z-30 mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm"
    >
      <label className={labelCls}>年<input name="year" type="number" defaultValue={year} className={inputCls} /></label>
      <label className={labelCls}>月<input name="month" type="number" min={1} max={12} defaultValue={month} className={inputCls} /></label>
      <label className={labelCls}>日<input name="day" type="number" min={1} max={31} defaultValue={day} className={inputCls} /></label>
      <label className={labelCls}>时<input name="hour" type="number" min={0} max={23} defaultValue={hour} className={inputCls} /></label>
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
