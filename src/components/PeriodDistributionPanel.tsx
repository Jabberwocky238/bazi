import { useEffect, useMemo, useRef, useState } from 'react'
import {
  calculateBaziCalendarDistribution,
  type BaziCalendarDistribution,
  type CalendarDistributionSample,
  type SamplingUnit,
  type WuXing,
} from 'bazilib'
import { useBaziInput, useDayun } from '@@/stores'
import { WUXING_SVG_COLOR, WUXING_TEXT } from '@@/css'

const WUXING = ['木', '火', '土', '金', '水'] as const satisfies readonly WuXing[]
const UNIT_LABEL: Record<SamplingUnit, string> = { month: '月', day: '日', year: '年' }
const WIDTH = 700
const HEIGHT = 190
const PAD = { left: 40, right: 12, top: 14, bottom: 30 }

interface Settings { pace: number; steps: number; unit: SamplingUnit }

function defaults(kind: '大运' | '流年'): Settings {
  return kind === '大运'
    ? { pace: 1, steps: 60, unit: 'month' }
    : { pace: 1, steps: 6, unit: 'month' }
}

function readSettings(key: string, kind: '大运' | '流年'): Settings {
  const fallback = defaults(kind)
  if (typeof window === 'undefined') return fallback
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '') as Partial<Settings>
    return {
      pace: Number.isSafeInteger(value.pace) && (value.pace ?? 0) > 0 ? value.pace! : fallback.pace,
      steps: Number.isSafeInteger(value.steps) && (value.steps ?? -1) >= 0 ? value.steps! : fallback.steps,
      unit: value.unit === 'day' || value.unit === 'year' || value.unit === 'month' ? value.unit : fallback.unit,
    }
  } catch {
    return fallback
  }
}

function linePoints(samples: CalendarDistributionSample[], value: (sample: CalendarDistributionSample) => number, min: number, max: number) {
  const width = WIDTH - PAD.left - PAD.right
  const height = HEIGHT - PAD.top - PAD.bottom
  return samples.map((sample, index) => {
    const x = PAD.left + index / Math.max(1, samples.length - 1) * width
    const y = PAD.top + (1 - (value(sample) - min) / (max - min || 1)) * height
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

function CurveChart({ result, mode }: { result: BaziCalendarDistribution; mode: 'strength' | 'wuxing' }) {
  const strengthValues = result.samples.map((sample) => sample.strengthScore)
  const maxWuxing = Math.max(...result.samples.flatMap((sample) => WUXING.map((wx) => sample.wuxingStrength[wx])))
  const min = mode === 'strength' ? Math.floor((Math.min(...strengthValues, 0) - 5) / 10) * 10 : 0
  const max = mode === 'strength' ? Math.ceil((Math.max(...strengthValues, 0) + 5) / 10) * 10 : maxWuxing
  const centerX = PAD.left + (WIDTH - PAD.left - PAD.right) / 2
  const unit = UNIT_LABEL[result.samplingUnit]
  return <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full" role="img">
    {[0, 0.5, 1].map((ratio) => {
      const y = PAD.top + ratio * (HEIGHT - PAD.top - PAD.bottom)
      return <g key={ratio}>
        <line x1={PAD.left} y1={y} x2={WIDTH - PAD.right} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
        <text x={PAD.left - 6} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px]">{(max - ratio * (max - min)).toFixed(1)}</text>
      </g>
    })}
    <line x1={centerX} y1={PAD.top} x2={centerX} y2={HEIGHT - PAD.bottom} stroke="#d97706" strokeDasharray="3 3" />
    {mode === 'strength'
      ? <polyline points={linePoints(result.samples, (sample) => sample.strengthScore, min, max)} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" />
      : WUXING.map((wx) => <polyline key={wx} points={linePoints(result.samples, (sample) => sample.wuxingStrength[wx], min, max)} fill="none" stroke={WUXING_SVG_COLOR[wx]} strokeWidth="2" strokeLinejoin="round"><title>{wx}</title></polyline>)}
    <text x={PAD.left} y={HEIGHT - 8} className="fill-slate-400 text-[9px]">{result.samples[0].offset}{unit}</text>
    <text x={centerX} y={HEIGHT - 8} textAnchor="middle" className="fill-amber-600 text-[9px]">基准</text>
    <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end" className="fill-slate-400 text-[9px]">+{result.samples.at(-1)?.offset}{unit}</text>
  </svg>
}

function ProbabilityList({ title, items }: { title: string; items: Array<{ value: string; probability: number }> }) {
  return <div>
    <h4 className="mb-2 truncate text-[10px] font-medium text-slate-500 sm:text-[11px]">{title}</h4>
    <div className="space-y-2">{items.map((item) => <div key={item.value} className="min-w-0 text-[10px] sm:text-xs">
      <div className="mb-1 flex min-w-0 items-center justify-between gap-1">
        <span className="truncate text-slate-600 dark:text-slate-300" title={item.value}>{item.value}</span>
        <span className="shrink-0 tabular-nums text-slate-500">{(item.probability * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800"><div className="h-full bg-amber-600" style={{ width: `${item.probability * 100}%` }} /></div>
    </div>)}</div>
  </div>
}

function validAnchorDay(year: number, month: number, day: number): number {
  return Math.min(day, new Date(Date.UTC(year, month, 0)).getUTCDate())
}

function HoldMoveButton({ direction, title, onMove }: { direction: 'left' | 'right'; title: string; onMove: () => void }) {
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const actionRef = useRef(onMove)
  const pointerClickRef = useRef(false)
  actionRef.current = onMove

  const stop = () => {
    if (delayRef.current) clearTimeout(delayRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    delayRef.current = null
    intervalRef.current = null
  }

  useEffect(() => stop, [])

  return <button
    type="button"
    title={title}
    aria-label={title}
    onPointerDown={(event) => {
      if (event.button !== 0) return
      event.currentTarget.setPointerCapture(event.pointerId)
      pointerClickRef.current = true
      actionRef.current()
      stop()
      delayRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => actionRef.current(), 125)
      }, 350)
    }}
    onPointerUp={stop}
    onPointerCancel={stop}
    onLostPointerCapture={stop}
    onClick={() => {
      if (pointerClickRef.current) {
        pointerClickRef.current = false
        return
      }
      actionRef.current()
    }}
    className="flex h-8 w-8 touch-none select-none items-center justify-center rounded border border-slate-300 bg-white text-base text-slate-700 transition hover:border-amber-600 hover:text-amber-700 active:bg-amber-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:active:bg-amber-950/30"
  >
    {direction === 'left' ? '←' : '→'}
  </button>
}

export function PeriodDistributionPanel({ kind, anchor, anchorLabel }: { kind: '大运' | '流年'; anchor: { year: number; month: number; day: number }; anchorLabel: string }) {
  const birth = useBaziInput()
  const moveCursor = useDayun((state) => state.moveDistributionCursor)
  const storageKey = `ultrabazi.distribution.${kind === '大运' ? 'dayun' : 'liunian'}`
  const [settings, setSettings] = useState<Settings>(() => readSettings(storageKey, kind))
  useEffect(() => { window.localStorage.setItem(storageKey, JSON.stringify(settings)) }, [settings, storageKey])

  const result = useMemo(() => calculateBaziCalendarDistribution({
    mode: birth.mode as 'gregorian' | 'trueSolar',
    year: anchor.year,
    month: anchor.month,
    day: validAnchorDay(anchor.year, anchor.month, anchor.day),
    hour: birth.hour,
    minute: birth.minute,
    longitude: birth.longitude,
    sex: birth.sex,
  }, settings.pace, settings.steps, settings.unit), [birth.mode, birth.hour, birth.minute, birth.longitude, birth.sex, anchor, settings])

  const center = result.samples[settings.steps]
  return <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 className="text-xs font-medium tracking-[0.2em] text-slate-600 dark:text-slate-300">岁运分布 · {kind}</h3>
        <p className="mt-1 text-[10px] text-slate-400">{anchorLabel} · 基准 {center.date.year}-{String(center.date.month).padStart(2, '0')}-{String(center.date.day).padStart(2, '0')} · {result.samples.length} 样本</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-2 text-xs text-slate-500 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
        <div className="flex items-center gap-1">
          <HoldMoveButton direction="left" title={`后退 ${settings.pace}${UNIT_LABEL[settings.unit]}`} onMove={() => moveCursor(-1, settings.unit, settings.pace)} />
          <HoldMoveButton direction="right" title={`前进 ${settings.pace}${UNIT_LABEL[settings.unit]}`} onMove={() => moveCursor(1, settings.unit, settings.pace)} />
        </div>
        <label className="flex min-w-0 items-center justify-between gap-1.5 sm:justify-start">采样单位
          <select value={settings.unit} onChange={(event) => setSettings((value) => ({ ...value, unit: event.target.value as SamplingUnit }))} className="h-8 min-w-0 rounded border border-slate-300 bg-white px-2 outline-none focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950">
            <option value="month">月</option><option value="day">日</option><option value="year">年</option>
          </select>
        </label>
        <label className="flex min-w-0 items-center justify-between gap-1.5 sm:justify-start">步长
          <input type="number" min="1" max="100" value={settings.pace} onChange={(event) => setSettings((value) => ({ ...value, pace: Math.min(100, Math.max(1, Number(event.target.value) || 1)) }))} className="h-8 w-14 rounded border border-slate-300 bg-white px-2 text-right tabular-nums outline-none focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950" />
        </label>
        <label className="flex min-w-0 items-center justify-between gap-1.5 sm:justify-start">上下
          <input type="number" min="1" max="100" value={settings.steps} onChange={(event) => setSettings((value) => ({ ...value, steps: Math.min(100, Math.max(1, Number(event.target.value) || 1)) }))} className="h-8 w-14 rounded border border-slate-300 bg-white px-2 text-right tabular-nums outline-none focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950" />
          <span>步</span>
        </label>
      </div>
    </div>

    <div className="mt-4 grid gap-5 lg:grid-cols-2 lg:gap-6">
      <div className="min-w-0"><h4 className="mb-1 text-[11px] text-slate-500">身强弱分数</h4><CurveChart result={result} mode="strength" /></div>
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><h4 className="text-[11px] text-slate-500">五行力量</h4><div className="flex w-full flex-wrap gap-x-2 gap-y-1 text-[10px] sm:w-auto">{WUXING.map((wx) => <span key={wx} className={WUXING_TEXT[wx]}>● {wx}</span>)}</div></div>
        <CurveChart result={result} mode="wuxing" />
      </div>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 md:gap-5">
      <ProbabilityList title="身强弱概率" items={result.summary.strengthLevels} />
      <ProbabilityList title="用神概率" items={result.summary.primaryWuxing} />
      <ProbabilityList title="喜神概率" items={result.summary.secondaryWuxing} />
    </div>
  </div>
}
