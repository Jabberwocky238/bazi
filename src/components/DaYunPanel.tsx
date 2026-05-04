import { useMemo, useState } from 'react'
import {
  computeShishen,
  ganWuxing,
  zhiWuxing,
  type Gan,
  type Pillar as EnginePillar,
  type Zhi,
} from '@jabberwocky238/bazi-engine'
import {
  HOUR_UNKNOWN,
  shishenWuxing,
  useBazi,
} from '@/lib'
import { WUXING_TEXT, WUXING_BORDER, WUXING_FROM } from '@@/css'
import {
  useBaziStore,
  useBaziInput,
  useDayun,
  type ExtraPillar,
  type DaYunStep,
  type LiuNianEntry,
  type LiuYueEntry,
} from '@@/stores'

interface GzCell {
  gan: string
  zhi: string
  ganWx: string
  zhiWx: string
  ganSs: string
  zhiSs: string
  ganSsWx: string
  zhiSsWx: string
  /** 藏干十神 (本气在前). */
  hideSs: string[]
}

function analyzeGz(dayPillar: EnginePillar | null, gz: string): GzCell {
  const gan = gz[0] ?? ''
  const zhi = gz[1] ?? ''
  const empty: GzCell = {
    gan, zhi, ganWx: '', zhiWx: '', ganSs: '', zhiSs: '',
    ganSsWx: '', zhiSsWx: '', hideSs: [],
  }
  if (!gan || !zhi || !dayPillar) return empty
  const r = computeShishen(dayPillar, { gan: gan as Gan, zhi: zhi as Zhi })
  const ganSs = r.十神 === '日主' ? '比肩' : r.十神
  const zhiSs = r.藏干十神[0] ?? ''
  return {
    gan,
    zhi,
    ganWx: ganWuxing(gan as Gan) ?? '',
    zhiWx: zhiWuxing(zhi as Zhi) ?? '',
    ganSs,
    zhiSs,
    ganSsWx: shishenWuxing(dayPillar.gan, ganSs),
    zhiSsWx: shishenWuxing(dayPillar.gan, zhiSs),
    hideSs: r.藏干十神,
  }
}

type DaYunStepView = DaYunStep & { cell: GzCell | null }
type LiuYueEntryView = LiuYueEntry & { cell: GzCell }
type LiuNianEntryView = LiuNianEntry & { cell: GzCell; liuyueView: LiuYueEntryView[] }

export function DaYunPanel() {
  const hour = useBaziInput((s) => s.hour)
  const dayPillarRaw = useBazi((s) => s.pillars[2])
  const dayPillar: EnginePillar | null = dayPillarRaw && dayPillarRaw.gan && dayPillarRaw.zhi
    ? { gan: dayPillarRaw.gan as Gan, zhi: dayPillarRaw.zhi as Zhi }
    : null
  const raw = useDayun((s) => s.data)
  const extras = useBaziStore((s) => s.extraPillars)
  const setExtras = useBaziStore((s) => s.setExtraPillars)

  const data = useMemo(() => {
    if (!raw) return null
    const steps: DaYunStepView[] = raw.steps.map((s) => ({
      ...s,
      cell: s.gz ? analyzeGz(dayPillar, s.gz) : null,
    }))
    const liunian: LiuNianEntryView[][] = raw.liunian.map((list) =>
      list.map((ln) => ({
        ...ln,
        cell: analyzeGz(dayPillar, ln.gz),
        liuyueView: ln.liuyue.map((ly) => ({ ...ly, cell: analyzeGz(dayPillar, ly.gz) })),
      })),
    )
    return {
      forward: raw.forward,
      startYear: raw.startYear,
      startMonth: raw.startMonth,
      startDay: raw.startDay,
      steps,
      liunian,
    }
  }, [raw, dayPillar])

  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const [activeLnIdx, setActiveLnIdx] = useState<number | null>(null)

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
  const activeLnEntry = activeLnIdx !== null ? liuNian[activeLnIdx] ?? null : null
  const activeExtraYear =
    extras.find((e) => e.label === '流年')?.gz ?? null
  const activeExtraMonth =
    extras.find((e) => e.label === '流月')?.gz ?? null

  const daYunExtra = (step: DaYunStepView): ExtraPillar | null => {
    if (!step.cell) return null
    return {
      label: '大运',
      gan: step.cell.gan as ExtraPillar['gan'],
      zhi: step.cell.zhi as ExtraPillar['zhi'],
      gz: step.gz,
      shishen: step.cell.ganSs as ExtraPillar['shishen'],
      hideShishen: step.cell.hideSs as ExtraPillar['hideShishen'],
      desc: `${step.startYear}-${step.endYear}`,
    }
  }

  const liuNianExtra = (ln: LiuNianEntryView): ExtraPillar => ({
    label: '流年',
    gan: ln.cell.gan as ExtraPillar['gan'],
    zhi: ln.cell.zhi as ExtraPillar['zhi'],
    gz: ln.gz,
    shishen: ln.cell.ganSs as ExtraPillar['shishen'],
    hideShishen: ln.cell.hideSs as ExtraPillar['hideShishen'],
    desc: `${ln.year} · ${ln.age} 岁`,
  })

  const liuYueExtra = (ly: LiuYueEntryView): ExtraPillar => ({
    label: '流月',
    gan: ly.cell.gan as ExtraPillar['gan'],
    zhi: ly.cell.zhi as ExtraPillar['zhi'],
    gz: ly.gz,
    shishen: ly.cell.ganSs as ExtraPillar['shishen'],
    hideShishen: ly.cell.hideSs as ExtraPillar['hideShishen'],
    desc: `${ly.monthName}月`,
  })

  const onPickDaYun = (i: number) => {
    if (activeIdx === i) {
      setActiveIdx(null)
      setActiveLnIdx(null)
      setExtras([])
      return
    }
    setActiveIdx(i)
    setActiveLnIdx(null)
    const step = data.steps[i]
    const extra = daYunExtra(step)
    setExtras(extra ? [extra] : [])
  }

  const onPickLiuNian = (i: number, ln: LiuNianEntryView) => {
    if (!activeStep) return
    const sameAsActive = activeExtraYear === ln.gz
    const dyE = daYunExtra(activeStep)
    const next: ExtraPillar[] = []
    if (dyE) next.push(dyE)
    if (!sameAsActive) {
      next.push(liuNianExtra(ln))
      setActiveLnIdx(i)
    } else {
      setActiveLnIdx(null)
    }
    setExtras(next)
  }

  const onPickLiuYue = (ly: LiuYueEntryView) => {
    if (!activeStep || !activeLnEntry) return
    const sameAsActive = activeExtraMonth === ly.gz
    const next: ExtraPillar[] = []
    const dyE = daYunExtra(activeStep)
    if (dyE) next.push(dyE)
    next.push(liuNianExtra(activeLnEntry))
    if (!sameAsActive) next.push(liuYueExtra(ly))
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

      {/* 流年展开 —— 横向不折行 */}
      {activeIdx !== null && activeStep && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 mb-2">
            流年 · {activeStep.gz || '起运前'} · {activeStep.startAge}-{activeStep.endAge} 岁
          </div>
          <div className="overflow-x-auto -mx-1">
            <div className="flex gap-1.5 px-1 pb-1 min-w-max">
              {liuNian.map((ln, i) => (
                <LiuNianCard
                  key={i}
                  entry={ln}
                  active={activeExtraYear === ln.gz}
                  onClick={() => onPickLiuNian(i, ln)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 流月展开 —— 横向不折行 */}
      {activeLnEntry && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 mb-2">
            流月 · {activeLnEntry.gz} · {activeLnEntry.year} 年
          </div>
          <div className="overflow-x-auto -mx-1">
            <div className="flex gap-1.5 px-1 pb-1 min-w-max">
              {activeLnEntry.liuyueView.map((ly, i) => (
                <LiuYueCard
                  key={i}
                  entry={ly}
                  active={activeExtraMonth === ly.gz}
                  onClick={() => onPickLiuYue(ly)}
                />
              ))}
            </div>
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
  // 起运前 (无干支) 的 block 不允许点击
  const disabled = !c
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className={[
        'shrink-0 w-[5.5rem] md:w-24 rounded-lg border px-2 py-2 text-center transition',
        disabled
          ? 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 opacity-60 cursor-not-allowed'
          : active
            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
            : 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 hover:border-amber-500 cursor-pointer',
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
        'shrink-0 w-[4.5rem] md:w-20 rounded border px-1 py-1 text-center transition cursor-pointer',
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

function LiuYueCard({
  entry, active, onClick,
}: { entry: LiuYueEntryView; active: boolean; onClick: () => void }) {
  const c = entry.cell
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'shrink-0 w-[4rem] md:w-[4.5rem] rounded border px-1 py-1 text-center transition cursor-pointer',
        active
          ? 'border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/60 dark:bg-amber-950/30'
          : 'border-slate-200 dark:border-slate-700 hover:border-amber-500',
        `border-t-2 ${WUXING_BORDER[c.ganWx] ?? ''}`,
      ].join(' ')}
    >
      <div className="text-[10px] text-slate-500 dark:text-slate-400">{entry.monthName}月</div>
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
