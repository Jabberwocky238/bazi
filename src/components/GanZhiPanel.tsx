import { useMemo, useState } from 'react'
import {
  analyzeGanZhi,
  type FindingKind,
  type HeFinding,
  type ConflictFinding,
  type MuKuFinding,
  type WholePillarFinding,
  type ZhengHeFinding,
  type FindingMod,
} from '@jabberwocky238/bazi-engine'
import { useBazi } from '@/lib'
import { useBaziStore, type ExtraPillar } from '@@/stores'
import { SkillLink } from '@@/SkillLink'

type AnyFinding = HeFinding | ConflictFinding | MuKuFinding | WholePillarFinding | ZhengHeFinding

const SECTION_LABEL = 'text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 uppercase'

/** 每类 finding 的色调 */
const KIND_TONE: Record<FindingKind, string> = {
  天干五合: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  地支六合: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  地支三合: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  地支三会: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  地支暗合: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  天干相冲: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  地支相冲: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  地支相刑: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  天干相克: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  地支相害: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  地支相破: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  争合: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  妒合: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  盖头: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  截脚: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  覆载: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  墓库: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400',
}

function toExtraInputs(extras: ExtraPillar[]) {
  return extras.map((e) => ({ label: e.label, gan: e.gan, zhi: e.zhi, gz: e.gz }))
}

export function GanZhiPanel() {
  const pillars = useBazi((s) => s.pillars)
  const extras = useBaziStore((s) => s.extraPillars)
  const [open, setOpen] = useState(true)

  const a = useMemo(
    () => analyzeGanZhi(pillars, toExtraInputs(extras)),
    [pillars, extras],
  )
  if (!a) return null

  const hetotal =
    a.天干五合.length + a.地支六合.length + a.地支三合.length + a.地支三会.length
  const chongtotal = a.天干相冲.length + a.地支相冲.length
  const xinghaiototal =
    a.地支相刑.length + a.地支相害.length + a.地支相破.length + a.地支暗合.length
  const zhuTotal = a.盖头.length + a.截脚.length + a.覆载.length

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full flex items-center justify-between gap-3 flex-wrap text-left ${open ? 'mb-4' : ''}`}
      >
        <span className="flex items-baseline gap-2">
          <span className={`text-[11px] inline-block transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
          <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
            干支作用 · 刑冲合会害破墓
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-slate-600">
            {open ? '点击收起' : '点击展开'}
          </span>
        </span>
        <div className="flex items-baseline gap-2 text-xs">
          <span className="text-emerald-700 dark:text-emerald-400">合 {hetotal}</span>
          <span className="text-rose-700 dark:text-rose-400">冲 {chongtotal}</span>
          <span className="text-amber-700 dark:text-amber-400">刑害破 {xinghaiototal}</span>
          <span className="text-indigo-700 dark:text-indigo-400">库 {a.墓库.length}</span>
          <span className="text-slate-500 dark:text-slate-400">柱 {zhuTotal}</span>
        </div>
      </button>

      {open && (
        <div className="space-y-5 text-sm">
          <Section label="① 合 · 天干五合 / 地支六合 / 三合 / 三会">
            <FindingList list={[...a.天干五合, ...a.地支六合, ...a.地支三合, ...a.地支三会]} />
          </Section>
          <Section label="② 冲 · 天干相冲 / 地支相冲">
            <FindingList list={[...a.天干相冲, ...a.地支相冲]} />
          </Section>
          <Section label="③ 刑 · 地支相刑 / 自刑">
            <FindingList list={a.地支相刑} />
          </Section>
          <Section label="④ 害 (穿) · 六害">
            <FindingList list={a.地支相害} />
          </Section>
          <Section label="⑤ 克 / 破 / 绝 (暗合)">
            <FindingList list={[...a.天干相克, ...a.地支相破, ...a.地支暗合]} />
          </Section>
          <Section label="⑥ 墓库 · 开 / 闭 / 静">
            <FindingList list={a.墓库} />
          </Section>
          <Section label="⑦ 柱内 · 盖头 / 截脚 / 覆载">
            <FindingList list={[...a.盖头, ...a.截脚, ...a.覆载]} />
          </Section>

          <div className="text-[10px] text-slate-400 dark:text-slate-600 text-right leading-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            依 @jabberwocky238/bazi-engine analyzeGanZhi · 定性判断，不加权打分
            <br />
            md 明文：三会 &gt; 三合 &gt; 六合 &gt; 六冲 &gt; 三刑 &gt; 六害 &gt; 六破 · 合冲同现需人工裁断
            <br />
            岁运 引化 / 冲克 / 冲开 状态由 detector 直接挂在 finding 上 (化解 / 冲克 / 冲开 标签)
          </div>
        </div>
      )}
    </section>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className={SECTION_LABEL}>{label}</div>
      {children}
    </div>
  )
}

function FindingList({ list }: { list: AnyFinding[] }) {
  if (list.length === 0) {
    return <div className="text-xs text-slate-400 dark:text-slate-600 italic">无</div>
  }
  return (
    <div className="flex flex-col gap-1.5">
      {list.map((f, idx) => (
        <FindingRow key={`${f.kind}-${f.name}-${f.positions}-${idx}`} f={f} />
      ))}
    </div>
  )
}

function FindingRow({ f }: { f: AnyFinding }) {
  const dissolved: FindingMod[] = 'dissolved' in f ? (f.dissolved ?? []) : []
  const impacted: FindingMod[]  = 'impacted'  in f ? (f.impacted  ?? []) : []
  const opened: FindingMod[]    = 'opened'    in f ? (f.opened    ?? []) : []
  const close = 'close' in f ? f.close : false
  const transformed = 'transformed' in f ? f.transformed : undefined
  const isDissolved = dissolved.length > 0
  return (
    <div
      className={`rounded-md border px-2.5 py-1.5 text-xs leading-relaxed ${KIND_TONE[f.kind]} ${
        isDissolved ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] opacity-70 font-medium">{f.kind}</span>
        <span className={`font-bold text-sm ${isDissolved ? 'line-through decoration-amber-500/70' : ''}`}>
          {f.mdKey ? (
            <SkillLink category="jichu" name={f.mdKey} className="underline decoration-dotted">{f.name}</SkillLink>
          ) : (
            f.name
          )}
        </span>
        <span className="text-[10px] opacity-80 tabular-nums">[{f.positions}{close ? ' · 紧贴' : ''}]</span>
        <span className="ml-auto text-[11px] font-medium">
          {f.state}
          {transformed !== undefined && (
            <span className={transformed ? 'ml-1 text-emerald-700 dark:text-emerald-400' : 'ml-1 opacity-60'}>
              {transformed ? '✓化' : '未化'}
            </span>
          )}
        </span>
      </div>
      {f.note && <div className="text-[10px] opacity-80 mt-0.5">{f.note}</div>}
      {dissolved.map((d, i) => (
        <FindingTag key={`d-${d.by.label}-${d.by.gz}-${i}`} tone="amber" prefix="化解">
          {d.by.label} {d.by.gz} → {d.via}
        </FindingTag>
      ))}
      {impacted.map((d, i) => (
        <FindingTag key={`i-${d.by.label}-${d.by.gz}-${i}`} tone="rose" prefix="冲克">
          {d.by.label} {d.by.gz} → {d.via}
        </FindingTag>
      ))}
      {opened.map((d, i) => (
        <FindingTag key={`o-${d.by.label}-${d.by.gz}-${i}`} tone="indigo" prefix="冲开">
          {d.by.label} {d.by.gz} → {d.via}
        </FindingTag>
      ))}
    </div>
  )
}

const TAG_TONES = {
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  rose: 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  indigo: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300',
} as const

function FindingTag({
  tone,
  prefix,
  children,
}: {
  tone: keyof typeof TAG_TONES
  prefix: string
  children: React.ReactNode
}) {
  return (
    <div className={`text-[10px] mt-0.5 mr-1 px-1.5 py-0.5 inline-block rounded border ${TAG_TONES[tone]}`}>
      {prefix} · {children}
    </div>
  )
}
