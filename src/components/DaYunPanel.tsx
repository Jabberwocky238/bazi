import { useMemo, useState } from 'react'
import {
  shishenOf,
  ganWuxing,
  zhiWuxing,
  CANG_GAN,
  type Gan,
  type Zhi,
} from '@jabberwocky238/bazi-engine'
import {
  type ExtraPillar,
  HOUR_UNKNOWN,
  WUXING_TEXT,
  WUXING_BORDER,
  WUXING_FROM,
  shishenWuxing,
  computeDaYun,
  type DaYunStep,
  type LiuNianEntry,
} from '@/lib'
import { useBaziStore, useBazi, useShiShen } from '@@/stores'

interface GzCell {
  gan: string
  zhi: string
  ganWx: string
  zhiWx: string
  ganSs: string
  zhiSs: string
  ganSsWx: string
  zhiSsWx: string
}

function analyzeGz(dayGan: string, gz: string): GzCell {
  const gan = gz[0] ?? ''
  const zhi = gz[1] ?? ''
  const cang = zhi ? CANG_GAN[zhi as Zhi]?.[0] ?? '' : ''
  const ganSs = gan && dayGan ? safeShishen(dayGan, gan) : ''
  const zhiSs = cang && dayGan ? safeShishen(dayGan, cang) : ''
  return {
    gan, zhi,
    ganWx: gan ? ganWuxing(gan as Gan) ?? '' : '',
    zhiWx: zhi ? zhiWuxing(zhi as Zhi) ?? '' : '',
    ganSs,
    zhiSs,
    ganSsWx: shishenWuxing(dayGan, ganSs),
    zhiSsWx: shishenWuxing(dayGan, zhiSs),
  }
}

function safeShishen(dayGan: string, other: string): string {
  try {
    return other === dayGan ? '比肩' : shishenOf(dayGan as Gan, other as Gan)
  } catch {
    return ''
  }
}

function buildHideShishen(dayGan: string, zhi: string): string[] {
  if (!zhi || !dayGan) return []
  const cangs = CANG_GAN[zhi as Zhi]
  if (!cangs) return []
  return cangs.map((g) => safeShishen(dayGan, g))
}

type DaYunStepView = DaYunStep & { cell: GzCell | null }
type LiuNianEntryView = LiuNianEntry & { cell: GzCell }

export function DaYunPanel() {
  const year = useBazi((s) => s.year)
  const month = useBazi((s) => s.month)
  const day = useBazi((s) => s.day)
  const hour = useBazi((s) => s.hour)
  const minute = useBazi((s) => s.minute)
  const sex = useBazi((s) => s.sex)
  const dayGan = useShiShen((s) => s.result.pillars[2]?.gan ?? '')
  const extras = useBaziStore((s) => s.extraPillars)
  const setExtras = useBaziStore((s) => s.setExtraPillars)

  const raw = useMemo(
    () => computeDaYun(year, month, day, hour, minute, sex),
    [year, month, day, hour, minute, sex],
  )

  const data = useMemo(() => {
    if (!raw) return null
    const steps: DaYunStepView[] = raw.steps.map((s) => ({
      ...s,
      cell: s.gz ? analyzeGz(dayGan, s.gz) : null,
    }))
    const liunian: LiuNianEntryView[][] = raw.liunian.map((list) =>
      list.map((ln) => ({ ...ln, cell: analyzeGz(dayGan, ln.gz) })),
    )
    return {
      forward: raw.forward,
      startYear: raw.startYear,
      startMonth: raw.startMonth,
      startDay: raw.startDay,
      steps,
      liunian,
    }
  }, [raw, dayGan])

  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  if (!data) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm">
        <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400 mb-3">
          大运流年
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {hour === HOUR_UNKNOWN ? '时柱未知，无法排大运' : '大运计算失败'}
        </p>
      </section>
    )
  }

  const liuNian = activeIdx !== null ? data.liunian[activeIdx] ?? [] : []
  const activeStep = activeIdx !== null ? data.steps[activeIdx] : null
  const activeExtraYear =
    extras.find((e) => e.label === '流年')?.gz ?? null

  const daYunExtra = (step: DaYunStepView): ExtraPillar | null => {
    if (!step.cell) return null
    return {
      label: '大运',
      gan: step.cell.gan,
      zhi: step.cell.zhi,
      gz: step.gz,
      shishen: step.cell.ganSs,
      hideShishen: buildHideShishen(dayGan, step.cell.zhi),
      desc: `${step.startYear}-${step.endYear}`,
    }
  }

  const liuNianExtra = (ln: LiuNianEntryView): ExtraPillar => ({
    label: '流年',
    gan: ln.cell.gan,
    zhi: ln.cell.zhi,
    gz: ln.gz,
    shishen: ln.cell.ganSs,
    hideShishen: buildHideShishen(dayGan, ln.gz),
    desc: `${ln.year} · ${ln.age} 岁`,
  })

  const onPickDaYun = (i: number) => {
    if (activeIdx === i) {
      setActiveIdx(null)
      setExtras([])
      return
    }
    setActiveIdx(i)
    const step = data.steps[i]
    const extra = daYunExtra(step)
    setExtras(extra ? [extra] : [])
  }

  const onPickLiuNian = (ln: LiuNianEntryView) => {
    if (!activeStep) return
    const dyE = daYunExtra(activeStep)
    const next: ExtraPillar[] = []
    if (dyE) next.push(dyE)
    if (activeExtraYear !== ln.gz) next.push(liuNianExtra(ln))
    setExtras(next)
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
          大运流年
        </h2>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          起运 {data.startYear} 年 {data.startMonth} 月 {data.startDay} 日 ·{' '}
          {data.forward ? '顺行' : '逆行'}
        </span>
      </div>

      {/* 大运横向时间线 */}
      <div className="overflow-x-auto -mx-1">
        <div className="flex gap-2 px-1 pb-1 min-w-max">
          {data.steps.map((step, i) => (
            <DaYunCard
              key={i}
              step={step}
              active={activeIdx === i}
              onClick={() => onPickDaYun(i)}
            />
          ))}
        </div>
      </div>

      {/* 流年展开 */}
      {activeIdx !== null && activeStep && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 mb-2">
            流年 · {activeStep.gz || '起运前'} · {activeStep.startAge}-{activeStep.endAge} 岁
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {liuNian.map((ln, i) => (
              <LiuNianCard
                key={i}
                entry={ln}
                active={activeExtraYear === ln.gz}
                onClick={() => onPickLiuNian(ln)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function DaYunCard({
  step, active, onClick,
}: { step: DaYunStepView; active: boolean; onClick: () => void }) {
  const c = step.cell
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 w-[5.5rem] md:w-24 rounded-lg border px-2 py-2 text-center transition',
        active
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
          : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 hover:border-amber-500',
        c ? `border-t-2 ${WUXING_BORDER[c.ganWx] ?? ''}` : '',
        c ? `bg-gradient-to-b to-transparent ${WUXING_FROM[c.ganWx] ?? ''}` : '',
      ].join(' ')}
    >
      <div className="text-[10px] text-slate-500 dark:text-slate-400">
        {step.startAge}-{step.endAge}
      </div>
      <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">
        {step.startYear}-{step.endYear}
      </div>
      {c ? (
        <>
          <div className="font-bold text-lg leading-tight">
            <span className={WUXING_TEXT[c.ganWx] ?? ''}>{c.gan}</span>
            <span className={WUXING_TEXT[c.zhiWx] ?? ''}>{c.zhi}</span>
          </div>
          <div className="text-[10px] mt-0.5 leading-tight">
            <span className={WUXING_TEXT[c.ganSsWx] ?? 'text-slate-500'}>{c.ganSs}</span>
            {c.zhiSs && (
              <>
                <span className="text-slate-400 mx-0.5">·</span>
                <span className={WUXING_TEXT[c.zhiSsWx] ?? 'text-slate-500'}>{c.zhiSs}</span>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="text-xs text-slate-400 mt-1">起运前</div>
      )}
    </button>
  )
}

function LiuNianCard({
  entry, active, onClick,
}: { entry: LiuNianEntryView; active: boolean; onClick: () => void }) {
  const c = entry.cell
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded border px-1 py-1 text-center transition cursor-pointer',
        active
          ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/60 dark:bg-amber-950/30'
          : 'border-slate-200 dark:border-slate-700 hover:border-amber-500',
        `border-t-2 ${WUXING_BORDER[c.ganWx] ?? ''}`,
      ].join(' ')}
    >
      <div className="text-[10px] text-slate-500 dark:text-slate-400">
        {entry.age}｜{entry.year}
      </div>
      <div className="font-bold text-sm leading-tight">
        <span className={WUXING_TEXT[c.ganWx] ?? ''}>{c.gan}</span>
        <span className={WUXING_TEXT[c.zhiWx] ?? ''}>{c.zhi}</span>
      </div>
      <div className="text-[10px] leading-tight mt-0.5">
        <span className={WUXING_TEXT[c.ganSsWx] ?? 'text-slate-500'}>{c.ganSs}</span>
      </div>
    </button>
  )
}
