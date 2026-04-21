import { useState } from 'react'
import { type Pillar, shishenWuxing } from '@/lib'
import { WUXING_BG_STRONG, WUXING_TEXT } from '@@/css'
import { useBaziStore, type ExtraPillar } from '@@/stores'
import { SkillLink } from '@@/SkillLink'

const GAN_WEIGHT = 1.0
const HIDDEN_WEIGHTS = [0.6, 0.3, 0.1]

interface Entry {
  name: string
  count: number
  weight: number
  pct: number
  inGan: boolean
  ganFirstPos: number
  wuxing: string
}

type MiniPillar = Pick<Pillar, 'shishen' | 'hideShishen'> | ExtraPillar

function compute(pillars: Pillar[], dayGan: string, extras: ExtraPillar[]): Entry[] {
  const map = new Map<string, Entry>()
  const ensure = (name: string): Entry => {
    let e = map.get(name)
    if (!e) {
      e = {
        name,
        count: 0,
        weight: 0,
        pct: 0,
        inGan: false,
        ganFirstPos: Infinity,
        wuxing: shishenWuxing(dayGan, name),
      }
      map.set(name, e)
    }
    return e
  }

  const ingest = (p: MiniPillar, ganPos: number) => {
    if (p.shishen && (p.shishen as string) !== '日主') {
      const e = ensure(p.shishen)
      e.weight += GAN_WEIGHT
      e.count += 1
      e.inGan = true
      e.ganFirstPos = Math.min(e.ganFirstPos, ganPos)
    }
    p.hideShishen.forEach((s, j) => {
      if (!s || (s as string) === '日主') return
      const e = ensure(s)
      e.weight += HIDDEN_WEIGHTS[j] ?? 0.05
      e.count += 1
    })
  }

  pillars.forEach((p, i) => ingest(p, i))
  // 大运/流年排在本命 4 柱后，ganFirstPos 继续累加
  extras.forEach((p, j) => ingest(p, 100 + j))

  const total = Array.from(map.values()).reduce((sum, e) => sum + e.weight, 0)
  map.forEach((e) => { e.pct = total > 0 ? (e.weight / total) * 100 : 0 })

  return Array.from(map.values())
}

export function ShishenProportion({ pillars }: { pillars: Pillar[] }) {
  const extras = useBaziStore((s) => s.extraPillars)
  const setExtras = useBaziStore((s) => s.setExtraPillars)
  const dayGan = pillars[2]?.gan ?? ''
  const [open, setOpen] = useState(true)

  const entries = compute(pillars, dayGan, extras)
  if (!entries.length) return null

  const inGan = entries
    .filter((e) => e.inGan)
    .sort((a, b) => a.ganFirstPos - b.ganFirstPos)
  const hiddenOnly = entries
    .filter((e) => !e.inGan)
    .sort((a, b) => b.count - a.count || b.weight - a.weight)

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-2 flex-wrap text-left ${open ? 'mb-4' : ''}`}
      >
        <span className="flex items-baseline gap-2">
          <span className={`text-[11px] inline-block transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
          <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
            十神占比
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-slate-600">
            {open ? '点击收起' : '点击展开'}
          </span>
        </span>
        {extras.length > 0 && (
          <span
            role="group"
            className="flex items-center gap-2 text-[11px]"
            onClick={(e) => e.stopPropagation()}
          >
            {extras.map((e) => (
              <span
                key={e.label + e.gz}
                className="px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              >
                {e.label} {e.gz}
              </span>
            ))}
            <span
              role="button"
              tabIndex={0}
              onClick={(ev) => { ev.stopPropagation(); setExtras([]) }}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault()
                  ev.stopPropagation()
                  setExtras([])
                }
              }}
              className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-red-500 hover:border-red-400 cursor-pointer"
            >
              清除大运影响
            </span>
          </span>
        )}
      </button>

      {open && (
        <>
          {inGan.length > 0 && <Group title="透干" entries={inGan} />}
          {hiddenOnly.length > 0 && (
            <Group title="仅藏干" entries={hiddenOnly} dimmed className={inGan.length ? 'mt-5' : ''} />
          )}
        </>
      )}
    </section>
  )
}

function Group({
  title,
  entries,
  dimmed,
  className,
}: {
  title: string
  entries: Entry[]
  dimmed?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <div className="mb-2 text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
        {title}
      </div>
      <div className="space-y-2">
        {entries.map((e) => <ProportionBar key={e.name} entry={e} dimmed={dimmed} />)}
      </div>
    </div>
  )
}

function ProportionBar({ entry, dimmed }: { entry: Entry; dimmed?: boolean }) {
  const barColor = WUXING_BG_STRONG[entry.wuxing] ?? 'bg-slate-400'
  const textColor = WUXING_TEXT[entry.wuxing] ?? ''
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className={`w-10 md:w-14 shrink-0 text-sm font-medium ${textColor}`}>
        <SkillLink category="shishen" name={entry.name}>{entry.name}</SkillLink>
      </div>
      <div className="flex-1 min-w-0 relative h-4 md:h-5 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barColor} ${dimmed ? 'opacity-70' : ''} transition-all`}
          style={{ width: `${entry.pct}%` }}
        />
      </div>
      <div className="w-12 md:w-14 shrink-0 text-right text-xs tabular-nums text-slate-600 dark:text-slate-400">
        {entry.pct.toFixed(1)}%
      </div>
      <div className="hidden sm:block w-8 shrink-0 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
        ×{entry.count}
      </div>
    </div>
  )
}
