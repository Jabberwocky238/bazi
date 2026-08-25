import { useMemo, useState } from 'react'
import { analyzeGanZhiWithExtras, type FlatFinding } from 'bazilib'
import type { MuKuVerdict } from '@jabberwocky238/bazi-engine'
import { useBazi, useBaziStore, type ExtraPillar } from '@@/stores'
import { SkillLink } from '@@/SkillLink'

const SECTION_LABEL = 'text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 uppercase'

/** 每类关系的色调 (engine 1.2.0 的 kind: 天干三类 + 地支八类)。 */
const HE_TONE = 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
const HE_STRONG_TONE = 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
const CHONG_TONE = 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400'
const KE_TONE = 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400'
const PO_TONE = 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400'
const MUKU_TONE = 'border-indigo-500/40 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400'

const KIND_TONE: Record<string, string> = {
  相合: HE_TONE, 六合: HE_TONE,
  三合: HE_STRONG_TONE, 三会: HE_STRONG_TONE,
  暗合: PO_TONE,
  相冲: CHONG_TONE, 相刑: CHONG_TONE,
  相克: KE_TONE, 相害: KE_TONE, 相破: PO_TONE,
  // 半合 / 拱合 / 拱会 —— 合的一种, 但力弱于整局, 用浅色
  子集: HE_TONE,
}

function toExtraInputs(extras: ExtraPillar[]) {
  return extras.map((e) => ({ label: e.label, gan: e.gan, zhi: e.zhi }))
}

export function GanZhiPanel() {
  const pillars = useBazi((s) => s.pillars)
  const extras = useBaziStore((s) => s.extraPillars)
  const [open, setOpen] = useState(true)

  const enginePillars = useMemo(
    () => pillars.map((p) => ({ gan: p.pillar.gan.str, zhi: p.pillar.zhi.str })),
    [pillars],
  )

  const analysis = useMemo(
    () => analyzeGanZhiWithExtras(enginePillars, toExtraInputs(extras)),
    [enginePillars, extras],
  )
  if (!analysis) return null
  const g = analysis.groups
  // 岁运柱已由 engine 一并入列 analyze(), 命中直接落在各组里 (hasExtra 标记)
  const extraHits = [...g.合, ...g.冲, ...g.刑, ...g.害, ...g.破克暗合, ...analysis.subsets]
    .filter((f) => f.hasExtra)
  const extraKeTotal = g.破克暗合.filter((f) => f.hasExtra && f.kind === '相克').length
  const hetotal = g.合.length
  const chongtotal = g.冲.length
  const xinghaiototal = g.刑.length + g.害.length + g.破克暗合.length

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
          {extraKeTotal > 0 && <span className="text-amber-700 dark:text-amber-400">克 {extraKeTotal}</span>}
          <span className="text-indigo-700 dark:text-indigo-400">库 {analysis.muku.length}</span>
        </div>
      </button>

      <div data-copy-collapsible hidden={!open} className="space-y-5 text-sm">
          <Section label="① 合 · 天干五合 / 地支六合 / 三合 / 三会">
            <FindingList list={g.合} />
          </Section>
          <Section label="② 冲 · 天干相冲 / 地支相冲">
            <FindingList list={g.冲} />
          </Section>
          <Section label="③ 刑 · 地支相刑 / 自刑">
            <FindingList list={g.刑} />
          </Section>
          <Section label="④ 害 (穿) · 六害">
            <FindingList list={g.害} />
          </Section>
          <Section label="⑤ 克 / 破 / 绝 (暗合)">
            <FindingList list={g.破克暗合} />
          </Section>
          <Section label="⑥ 墓库 · 开 / 闭 / 静">
            <MukuList list={analysis.muku} />
          </Section>
          {analysis.subsets.length > 0 && (
            <Section label="⑦ 子集 · 半合 / 拱合 / 拱会">
              <FindingList list={analysis.subsets} />
            </Section>
          )}
          {extraHits.length > 0 && (
            <Section label="⑧ 岁运引动 · 大运 / 流年 / 流月 × 原局">
              <FindingList list={extraHits} />
            </Section>
          )}
      </div>
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

function FindingList({ list }: { list: FlatFinding[] }) {
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

/** 墓库判定 —— 直接渲染 engine 的 MuKuVerdict。 */
function MukuList({ list }: { list: readonly MuKuVerdict[] }) {
  const present = list.filter((v) => v.present)
  if (present.length === 0) {
    return <div className="text-xs text-slate-400 dark:text-slate-600 italic">无</div>
  }
  return (
    <div className="flex flex-col gap-1.5">
      {present.map((v, idx) => (
        <div key={`${v.zhi}-${idx}`} className={`rounded-md border px-2.5 py-1.5 text-xs leading-relaxed ${MUKU_TONE}`}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[10px] opacity-70 font-medium">墓库</span>
            <span className="font-bold text-sm">{v.zhi}库</span>
            {v.count > 1 && <span className="text-[10px] opacity-80">×{v.count}</span>}
            <span className="ml-auto text-[11px] font-medium">
              {v.state}
              <span className={v.open ? 'ml-1 text-emerald-700 dark:text-emerald-400' : 'ml-1 opacity-60'}>
                {v.open ? '开' : '闭'}
              </span>
            </span>
          </div>
          {v.muQiWangShuai && (
            <div className="text-[10px] opacity-80 mt-0.5">墓气在月令 · {v.muQiWangShuai}</div>
          )}
        </div>
      ))}
    </div>
  )
}

function FindingRow({ f }: { f: FlatFinding }) {
  const isDissolved = f.dissolved.length > 0
  return (
    <div
      className={`rounded-md border px-2.5 py-1.5 text-xs leading-relaxed ${KIND_TONE[f.kind] ?? PO_TONE} ${
        isDissolved ? 'opacity-70' : ''
      }`}
    >
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] opacity-70 font-medium">{f.kind}</span>
        <span className={`font-bold text-sm ${isDissolved ? 'line-through decoration-amber-500/70' : ''}`}>
          {f.name}
        </span>
        {f.sub && <span className="text-[10px] opacity-70">{f.sub}</span>}
        {f.positions && (
          <span className="text-[10px] opacity-80 tabular-nums">
            [{f.positions}{f.close ? ' · 紧贴' : ''}]
          </span>
        )}
        {f.hasExtra && <span className="text-[10px] opacity-70">· 含岁运</span>}
      </div>
      {f.dissolved.map((d, i) => (
        <FindingTag key={`d-${d.by.label}-${d.by.gz}-${i}`} tone="amber" prefix="化解">
          {d.by.label} {d.by.gz} → {d.via}
        </FindingTag>
      ))}
      {f.impacted.map((d, i) => (
        <FindingTag key={`i-${d.by.label}-${d.by.gz}-${i}`} tone="rose" prefix="冲克">
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
