import type { Sex } from '@jabberwocky238/bazi-engine'
import { type BaziInputData } from '@@/stores/compute'
import { BaziFormView } from '@@/BaziForm'

/**
 * 合盘单人输入 — 全部 UI 复用 BaziFormView, 本地 useState 通过单 onChange 注入.
 * 主盘合盘共用 localStorage ('bazi.saved.v1'), 不再分命名空间.
 */

/** 合盘人物 state — BaziInputData + 称呼. */
export interface HepanState extends BaziInputData {
  name: string
}

export const defaultA: HepanState = {
  name: '左',
  mode: 'gregorian',
  year: 1990, month: 6, day: 15, hour: 12, minute: 0,
  longitude: 120, bazi: ['', '', '', ''], sex: 1,
}

export const defaultB: HepanState = {
  name: '右',
  mode: 'gregorian',
  year: 1992, month: 8, day: 20, hour: 14, minute: 0,
  longitude: 120, bazi: ['', '', '', ''], sex: 0 as Sex,
}

interface Props {
  label: string
  state: HepanState
  onChange: (s: HepanState) => void
}

export function HepanInput({ label, state, onChange }: Props) {
  return (
    <BaziFormView
      state={state}
      onChange={(next) => onChange({ ...state, ...next })}
      saveLoad={{ compact: true }}
      leading={
        <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
          人物 · {label}
          <input
            value={state.name}
            onChange={(e) => onChange({ ...state, name: e.target.value })}
            placeholder="称呼"
            maxLength={10}
            className="w-16 md:w-24 px-2 md:px-3 py-2 text-sm md:text-base rounded-md border border-slate-300 bg-white text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition"
          />
        </label>
      }
    />
  )
}
