import { useEffect, useMemo, useRef } from 'react'
import {
  shishenOf,
  shishenZhi,
  GanC,
  ZhiC,
  type Gan,
  type Pillar as EnginePillar,
  type Zhi,
} from '@jabberwocky238/bazi-engine'
import {
  HOUR_UNKNOWN,
  shishenWuxing,
} from '@LIB'
import { useBazi } from '@@/stores'
import { WUXING_TEXT, WUXING_BORDER, WUXING_FROM } from '@@/css'
import {
  useBaziStore,
  useBaziInput,
  useDayun,
  type ExtraPillar,
  type DaYunStep,
  type LiuNianEntry,
  type LiuYueEntry,
  type LiuRiEntry,
} from '@@/stores'
import { PeriodDistributionPanel } from '@@/PeriodDistributionPanel'

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
  const dayGan = GanC.from(dayPillar.gan)
  const ganC = GanC.from(gan as Gan)
  const zhiC = ZhiC.from(zhi as Zhi)
  const ganSs = shishenOf(dayGan, ganC)
  const zhiSs = shishenZhi(dayGan, zhiC)
  return {
    gan,
    zhi,
    ganWx: ganC.wuxing.str,
    zhiWx: zhiC.wuxing.str,
    ganSs: ganSs.str,
    zhiSs: zhiSs[0]?.str ?? '',
    ganSsWx: shishenWuxing(dayGan, ganSs)?.str ?? '',
    zhiSsWx: zhiSs[0] ? (shishenWuxing(dayGan, zhiSs[0])?.str ?? '') : '',
    hideSs: zhiSs.map((ss) => ss.str),
  }
}

type DaYunStepView = DaYunStep & { cell: GzCell | null }
type LiuRiEntryView = LiuRiEntry & { cell: GzCell }
type LiuYueEntryView = LiuYueEntry & { cell: GzCell; liuriView: LiuRiEntryView[] }
type LiuNianEntryView = LiuNianEntry & { cell: GzCell; liuyueView: LiuYueEntryView[] }

export function DaYunPanel() {
  const hour = useBaziInput((s) => s.hour)
  const birthMonth = useBaziInput((s) => s.month)
  const birthDay = useBaziInput((s) => s.day)
  const dayPillarRaw = useBazi((s) => s.pillars[2])
  const dayPillar: EnginePillar | null = useMemo(() => dayPillarRaw
    ? { gan: dayPillarRaw.pillar.gan.str, zhi: dayPillarRaw.pillar.zhi.str }
    : null, [dayPillarRaw])
  const raw = useDayun((s) => s.data)
  const activeIdx = useDayun((s) => s.activeIdx)
  const activeLnIdx = useDayun((s) => s.activeLnIdx)
  const activeLyIdx = useDayun((s) => s.activeLyIdx)
  const activeLrIdx = useDayun((s) => s.activeLrIdx)
  const distributionCursor = useDayun((s) => s.distributionCursor)
  const setSelection = useDayun((s) => s.setSelection)
  const setExtras = useBaziStore((s) => s.setExtraPillars)
  const liuyueScrollRef = useRef<HTMLDivElement>(null)
  const liuriScrollRef = useRef<HTMLDivElement>(null)

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
        liuyueView: ln.liuyue.map((ly) => ({
          ...ly,
          cell: analyzeGz(dayPillar, ly.gz),
          liuriView: ly.liuri.map((lr) => ({ ...lr, cell: analyzeGz(dayPillar, lr.gz) })),
        })),
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

  useEffect(() => {
    if (!raw || activeIdx === null || !dayPillar) {
      setExtras([])
      return
    }
    const step = raw.steps[activeIdx]
    if (!step?.gz) return
    const dyCell = analyzeGz(dayPillar, step.gz)
    const next: ExtraPillar[] = [{
      label: '大运', gan: dyCell.gan as Gan, zhi: dyCell.zhi as Zhi, gz: step.gz,
      shishen: dyCell.ganSs as ExtraPillar['shishen'], hideShishen: dyCell.hideSs as ExtraPillar['hideShishen'],
      desc: `${step.startYear}-${step.endYear}`,
    }]
    const ln = activeLnIdx === null ? null : raw.liunian[activeIdx]?.[activeLnIdx]
    if (ln?.gz) {
      const lnCell = analyzeGz(dayPillar, ln.gz)
      next.push({
        label: '流年', gan: lnCell.gan as Gan, zhi: lnCell.zhi as Zhi, gz: ln.gz,
        shishen: lnCell.ganSs as ExtraPillar['shishen'], hideShishen: lnCell.hideSs as ExtraPillar['hideShishen'],
        desc: `${ln.year} · ${ln.age} 岁`,
      })
      const ly = activeLyIdx === null ? null : ln.liuyue[activeLyIdx]
      if (ly?.gz) {
        const lyCell = analyzeGz(dayPillar, ly.gz)
        next.push({
          label: '流月', gan: lyCell.gan as Gan, zhi: lyCell.zhi as Zhi, gz: ly.gz,
          shishen: lyCell.ganSs as ExtraPillar['shishen'], hideShishen: lyCell.hideSs as ExtraPillar['hideShishen'],
          desc: `${ly.monthName}月`,
        })
      }
    }
    setExtras(next)
  }, [raw, activeIdx, activeLnIdx, activeLyIdx, dayPillar, setExtras])

  useEffect(() => {
    liuyueScrollRef.current?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeLyIdx])

  useEffect(() => {
    liuriScrollRef.current?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeLrIdx])

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
  const activeLyEntry = activeLyIdx !== null ? activeLnEntry?.liuyueView[activeLyIdx] ?? null : null

  const onPickDaYun = (i: number) => {
    if (activeIdx === i) {
      setSelection(null, null, null)
      return
    }
    const step = data.steps[i]
    const anchorYear = Math.floor((step.startYear + step.endYear) / 2)
    setSelection(i, null, { year: anchorYear, month: birthMonth, day: birthDay })
  }

  const onPickLiuNian = (i: number, ln: LiuNianEntryView) => {
    if (!activeStep) return
    const sameAsActive = activeLnIdx === i
    if (!sameAsActive) {
      setSelection(activeIdx, i, { year: ln.year, month: birthMonth, day: birthDay })
    } else {
      setSelection(activeIdx, null, distributionCursor)
    }
  }

  const onPickLiuYue = (i: number, ly: LiuYueEntryView) => {
    if (!activeStep || !activeLnEntry) return
    if (activeLyIdx === i) {
      setSelection(activeIdx!, activeLnIdx, distributionCursor, null, null)
      return
    }
    const firstDate = ly.liuriView[0]?.date
    if (!firstDate) return
    const [year, month, day] = firstDate.split('-').map(Number)
    setSelection(activeIdx!, activeLnIdx, { year, month, day }, i, null)
  }

  const onPickLiuRi = (i: number, lr: LiuRiEntryView) => {
    if (activeIdx === null || activeLnIdx === null || activeLyIdx === null) return
    const [year, month, day] = lr.date.split('-').map(Number)
    setSelection(activeIdx, activeLnIdx, { year, month, day }, activeLyIdx, i)
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
          <div ref={liuyueScrollRef} className="overflow-x-auto -mx-1">
            <div className="flex gap-1.5 px-1 pb-1 min-w-max">
              {liuNian.map((ln, i) => (
                <LiuNianCard
                  key={i}
                  entry={ln}
                  active={activeLnIdx === i}
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
                  active={activeLyIdx === i}
                  onClick={() => onPickLiuYue(i, ly)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeLyEntry && (
        <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="mb-2 text-[11px] font-medium tracking-[0.2em] text-slate-500 dark:text-slate-400">
            流日 · {activeLyEntry.gz} · {activeLyEntry.monthName}月
          </div>
          <div ref={liuriScrollRef} className="-mx-1 overflow-x-auto">
            <div className="flex min-w-max gap-1.5 px-1 pb-1">
              {activeLyEntry.liuriView.map((lr, i) => (
                <LiuRiCard key={lr.date} entry={lr} active={activeLrIdx === i} onClick={() => onPickLiuRi(i, lr)} />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeLnEntry && distributionCursor ? (
        <PeriodDistributionPanel kind="流年" anchor={distributionCursor} anchorLabel={`${activeLnEntry.year} · ${activeLnEntry.gz}`} />
      ) : activeStep?.gz && distributionCursor ? (
        <PeriodDistributionPanel
          kind="大运"
          anchor={distributionCursor}
          anchorLabel={`${activeStep.startYear}-${activeStep.endYear} · ${activeStep.gz}`}
        />
      ) : null}
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
      data-active={active}
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
      data-active={active}
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

function LiuRiCard({
  entry, active, onClick,
}: { entry: LiuRiEntryView; active: boolean; onClick: () => void }) {
  const c = entry.cell
  const day = Number(entry.date.slice(-2))
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active}
      className={[
        'w-[3.75rem] shrink-0 rounded border border-t-2 px-1 py-1 text-center transition',
        active
          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/30 dark:bg-amber-950/30'
          : 'border-slate-200 hover:border-amber-500 dark:border-slate-700',
        WUXING_BORDER[c.ganWx] ?? '',
      ].join(' ')}
    >
      <div className="text-[10px] text-slate-500 dark:text-slate-400">{day}日</div>
      <div className="text-sm font-bold leading-tight">
        <span className={WUXING_TEXT[c.ganWx] ?? ''}>{c.gan}</span>
        <span className={WUXING_TEXT[c.zhiWx] ?? ''}>{c.zhi}</span>
      </div>
    </button>
  )
}
