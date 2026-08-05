import { useMemo, useState } from 'react'
import {
  calculateBaziDistribution,
  type BaziDistributionSample,
  type ProbabilityItem,
  type WuXing,
} from '@LIB'
import { useBaziInput } from '@@/stores'
import { STRENGTH_LEVEL_COLOR, WUXING_SVG_COLOR, WUXING_TEXT } from '@@/css'

const WUXING = ['木', '火', '土', '金', '水'] as const satisfies readonly WuXing[]
const WIDTH = 720
const HEIGHT = 220
const PLOT = { left: 42, right: 14, top: 16, bottom: 30 }

function points(
  samples: BaziDistributionSample[],
  valueOf: (sample: BaziDistributionSample) => number,
  min: number,
  max: number,
): string {
  const plotWidth = WIDTH - PLOT.left - PLOT.right
  const plotHeight = HEIGHT - PLOT.top - PLOT.bottom
  const span = max - min || 1
  return samples.map((sample, index) => {
    const x = PLOT.left + (index / Math.max(1, samples.length - 1)) * plotWidth
    const y = PLOT.top + (1 - (valueOf(sample) - min) / span) * plotHeight
    return `${x.toFixed(2)},${y.toFixed(2)}`
  }).join(' ')
}

function ChartFrame({
  samples,
  min,
  max,
  children,
}: {
  samples: BaziDistributionSample[]
  min: number
  max: number
  children: React.ReactNode
}) {
  const centerX = PLOT.left + (WIDTH - PLOT.left - PLOT.right) / 2
  const zeroY = min < 0 && max > 0
    ? PLOT.top + (1 - (0 - min) / (max - min)) * (HEIGHT - PLOT.top - PLOT.bottom)
    : null
  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-auto w-full" role="img">
      {[0, 0.5, 1].map((ratio) => {
        const y = PLOT.top + ratio * (HEIGHT - PLOT.top - PLOT.bottom)
        const value = max - ratio * (max - min)
        return (
          <g key={ratio}>
            <line x1={PLOT.left} y1={y} x2={WIDTH - PLOT.right} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <text x={PLOT.left - 7} y={y + 3} textAnchor="end" className="fill-slate-400 text-[9px]">{value.toFixed(1)}</text>
          </g>
        )
      })}
      {zeroY !== null && <line x1={PLOT.left} y1={zeroY} x2={WIDTH - PLOT.right} y2={zeroY} stroke="currentColor" className="text-slate-400" strokeDasharray="4 4" />}
      <line x1={centerX} y1={PLOT.top} x2={centerX} y2={HEIGHT - PLOT.bottom} stroke="#d97706" strokeDasharray="3 3" />
      {children}
      <text x={PLOT.left} y={HEIGHT - 8} className="fill-slate-400 text-[9px]">{samples[0].offsetHours}h</text>
      <text x={centerX} y={HEIGHT - 8} textAnchor="middle" className="fill-amber-600 text-[9px]">出生时间</text>
      <text x={WIDTH - PLOT.right} y={HEIGHT - 8} textAnchor="end" className="fill-slate-400 text-[9px]">+{samples.at(-1)?.offsetHours}h</text>
    </svg>
  )
}

function StrengthChart({ samples }: { samples: BaziDistributionSample[] }) {
  const values = samples.map((sample) => sample.strengthScore)
  const min = Math.floor((Math.min(...values, 0) - 5) / 10) * 10
  const max = Math.ceil((Math.max(...values, 0) + 5) / 10) * 10
  return (
    <div className="min-w-0">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-medium text-slate-700 dark:text-slate-200">身强弱分数</h3>
        <span className="text-[10px] text-slate-400">S 值</span>
      </div>
      <ChartFrame samples={samples} min={min} max={max}>
        <polyline points={points(samples, (sample) => sample.strengthScore, min, max)} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" />
        {samples.map((sample, index) => {
          const [x, y] = points([sample], () => sample.strengthScore, min, max).split(',')
          const actualX = PLOT.left + (index / Math.max(1, samples.length - 1)) * (WIDTH - PLOT.left - PLOT.right)
          return <circle key={sample.offsetHours} cx={actualX} cy={y} r={index === Math.floor(samples.length / 2) ? 4 : 2} fill="#d97706"><title>{`${sample.offsetHours}h · ${sample.bazi.join(' ')} · ${sample.strengthLevel} ${sample.strengthScore}`}</title></circle>
        })}
      </ChartFrame>
    </div>
  )
}

function WuxingChart({ samples }: { samples: BaziDistributionSample[] }) {
  const max = Math.max(...samples.flatMap((sample) => WUXING.map((wx) => sample.wuxingStrength[wx])))
  return (
    <div className="min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-medium text-slate-700 dark:text-slate-200">五行力量</h3>
        <div className="flex w-full flex-wrap gap-x-2 gap-y-1 text-[10px] sm:w-auto">
          {WUXING.map((wx) => <span key={wx} className={WUXING_TEXT[wx]}>● {wx}</span>)}
        </div>
      </div>
      <ChartFrame samples={samples} min={0} max={max}>
        {WUXING.map((wx) => (
          <polyline key={wx} points={points(samples, (sample) => sample.wuxingStrength[wx], 0, max)} fill="none" stroke={WUXING_SVG_COLOR[wx]} strokeWidth="2" strokeLinejoin="round">
            <title>{`${wx}力量`}</title>
          </polyline>
        ))}
      </ChartFrame>
    </div>
  )
}

function ProbabilityBars<T extends string>({ title, items }: { title: string; items: ProbabilityItem<T>[] }) {
  return (
    <div className="min-w-0">
      <h3 className="mb-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">{title}</h3>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.value} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-2 text-xs">
            <span className="truncate text-slate-700 dark:text-slate-300" title={item.value}>{item.value}</span>
            <div className="h-1.5 overflow-hidden rounded-sm bg-slate-100 dark:bg-slate-800">
              <div className="h-full bg-amber-600" style={{ width: `${item.probability * 100}%` }} />
            </div>
            <span className="text-right tabular-nums text-slate-500">{(item.probability * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DistributionPanel() {
  const input = useBaziInput()
  const [paceHours, setPaceHours] = useState(3)
  const [steps, setSteps] = useState(50)
  const [open, setOpen] = useState(true)
  const canCalculate = input.mode !== 'bazi' && input.hour >= 0
  const result = useMemo(() => canCalculate ? calculateBaziDistribution({
    mode: input.mode as 'gregorian' | 'trueSolar',
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    minute: input.minute,
    longitude: input.longitude,
    sex: input.sex,
  }, paceHours, steps) : null, [canCalculate, input.mode, input.year, input.month, input.day, input.hour, input.minute, input.longitude, input.sex, paceHours, steps])

  const center = result?.samples[steps]
  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex items-baseline gap-2 text-left">
          <span className={`text-[11px] transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
          <h2 className="text-xs font-medium tracking-[0.25em] text-slate-500 dark:text-slate-400">时辰分布看板</h2>
        </button>
        {canCalculate && (
          <div className="flex w-full flex-wrap items-center justify-between gap-3 text-xs text-slate-500 sm:w-auto sm:justify-start">
            <label className="flex items-center gap-1.5">步长
              <input aria-label="分布步长（小时）" type="number" min="1" max="24" value={paceHours} onChange={(event) => setPaceHours(Math.min(24, Math.max(1, Number(event.target.value) || 1)))} className="h-8 w-14 rounded border border-slate-300 bg-white px-2 text-right tabular-nums text-slate-800 outline-none focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
              <span>h</span>
            </label>
            <label className="flex items-center gap-1.5">上下
              <input aria-label="分布上下步数" type="number" min="1" max="100" value={steps} onChange={(event) => setSteps(Math.min(100, Math.max(1, Number(event.target.value) || 1)))} className="h-8 w-14 rounded border border-slate-300 bg-white px-2 text-right tabular-nums text-slate-800 outline-none focus:border-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200" />
              <span>步</span>
            </label>
          </div>
        )}
      </div>

      {open && !canCalculate && <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800">需要明确的公历或真太阳时才能计算小时偏移分布。</p>}
      {open && result && center && (
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="mb-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
            <span>范围 <b className="font-medium text-slate-800 dark:text-slate-200">±{result.rangeHours}h</b></span>
            <span>样本 <b className="font-medium text-slate-800 dark:text-slate-200">{result.summary.sampleCount}</b></span>
            <span>中心 <b className={STRENGTH_LEVEL_COLOR[center.strengthLevel]}>{center.strengthLevel} {center.strengthScore}</b></span>
            <span>用神 <b className={center.primaryWuxing ? WUXING_TEXT[center.primaryWuxing] : ''}>{center.primaryWuxing ?? '无'}</b></span>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <StrengthChart samples={result.samples} />
            <WuxingChart samples={result.samples} />
          </div>
          <div className="mt-5 grid gap-5 border-t border-slate-100 pt-4 dark:border-slate-800 md:grid-cols-3">
            <ProbabilityBars title="身强弱概率" items={result.summary.strengthLevels} />
            <ProbabilityBars title="用神概率" items={result.summary.primaryWuxing} />
            <ProbabilityBars title="喜神概率" items={result.summary.secondaryWuxing} />
          </div>
        </div>
      )}
    </section>
  )
}
