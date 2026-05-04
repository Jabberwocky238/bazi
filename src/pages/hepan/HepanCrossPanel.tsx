import { useMemo, useState } from 'react'
import {
  type Pillar,
  analyzeHepanCrossBoth,
  type AnyFinding,
  type CrossFindings,
  type PillarPos,
} from '@/lib'
import { KIND_TONE } from '@@/css'

interface Props {
  a: Pillar[]
  aName: string
  b: Pillar[]
  bName: string
}

const POS_LIST: PillarPos[] = ['年', '月', '日', '时']

/** Canonical key for dedup of symmetric findings (双向 byPillar 合并时去重). */
function dedupeKey(f: AnyFinding): string {
  const parts = f.positions.split(' ↔ ').sort()
  return `${f.kind}|${f.name}|${parts.join('↔')}`
}
function dedupe(list: AnyFinding[]): AnyFinding[] {
  const seen = new Set<string>()
  const out: AnyFinding[] = []
  for (const f of list) {
    const k = dedupeKey(f)
    if (!seen.has(k)) { seen.add(k); out.push(f) }
  }
  return out
}

export function HepanCrossPanel({ a, aName, b, bName }: Props) {
  const [open, setOpen] = useState(true)

  const both = useMemo(
    () => analyzeHepanCrossBoth(a, aName, b, bName),
    [a, aName, b, bName],
  )

  // 按柱合并: 一柱 = 双向 byPillar 该柱 的 finding 去重 union
  // (e.g. 年柱 = 含 左年 涉及的 + 含 右年 涉及的; 同一对 pair 双向 finding 视作同一项)
  const byPos = useMemo(() => {
    if (!both) return null
    const out: Record<PillarPos, CrossFindings> = {
      年: { he: [], chong: [], xinghaipo: [], ke: [], total: 0 },
      月: { he: [], chong: [], xinghaipo: [], ke: [], total: 0 },
      日: { he: [], chong: [], xinghaipo: [], ke: [], total: 0 },
      时: { he: [], chong: [], xinghaipo: [], ke: [], total: 0 },
    }
    for (const pos of POS_LIST) {
      const merged = out[pos]
      const aSlice = both.aFromB.byPillar[pos]
      const bSlice = both.bFromA.byPillar[pos]
      merged.he        = dedupe([...aSlice.he, ...bSlice.he])
      merged.chong     = dedupe([...aSlice.chong, ...bSlice.chong])
      merged.xinghaipo = dedupe([...aSlice.xinghaipo, ...bSlice.xinghaipo])
      merged.ke        = dedupe([...aSlice.ke, ...bSlice.ke])
      merged.total = merged.he.length + merged.chong.length + merged.xinghaipo.length + merged.ke.length
    }
    return out
  }, [both])

  // 总览 union (4 类总数, 用于头部 chip)
  const totalCounts = useMemo(() => {
    if (!byPos) return { he: 0, chong: 0, xinghaipo: 0, ke: 0, total: 0 }
    const he = dedupe(POS_LIST.flatMap((p) => byPos[p].he))
    const chong = dedupe(POS_LIST.flatMap((p) => byPos[p].chong))
    const xinghaipo = dedupe(POS_LIST.flatMap((p) => byPos[p].xinghaipo))
    const ke = dedupe(POS_LIST.flatMap((p) => byPos[p].ke))
    return {
      he: he.length, chong: chong.length, xinghaipo: xinghaipo.length, ke: ke.length,
      total: he.length + chong.length + xinghaipo.length + ke.length,
    }
  }, [byPos])

  if (!both || !byPos) return null

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 flex-wrap text-left ${open ? 'mb-4' : ''}`}
      >
        <span className="flex items-baseline gap-2">
          <span className={`text-[11px] inline-block transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
          <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
            干支互动 · {aName} ↔ {bName}
          </h2>
        </span>
        <div className="flex items-baseline gap-2 text-xs">
          <span className="text-emerald-700 dark:text-emerald-400">合 {totalCounts.he}</span>
          <span className="text-rose-700 dark:text-rose-400">冲 {totalCounts.chong}</span>
          <span className="text-amber-700 dark:text-amber-400">刑害破 {totalCounts.xinghaipo}</span>
          <span className="text-amber-700 dark:text-amber-400">克 {totalCounts.ke}</span>
        </div>
      </button>

      {open && (
        <div className="space-y-3">
          {totalCounts.total === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {aName} 与 {bName} 无明显跨盘干支互动 (各柱仍展示, 便于对照)
            </p>
          )}
          {/* 4 柱并排 (左右排布), 移动端 2 列 / 桌面 4 列, 始终在同一 block 内. */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {POS_LIST.map((pos) => (
              <PillarCrossCard key={pos} pos={pos} cross={byPos[pos]} />
            ))}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            按柱合并: 同一柱位 ({aName} / {bName} 任一方) 涉及的所有跨盘合冲刑害克.
            合多缘深 / 冲多摩擦 / 刑害破暗耗 / 克为单向压制.
          </p>
        </div>
      )}
    </section>
  )
}

function PillarCrossCard({ pos, cross }: { pos: PillarPos; cross: CrossFindings }) {
  const tone = cross.total === 0
    ? 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-950/30'
    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
  return (
    <div className={`rounded-lg border px-2 md:px-3 py-2 min-w-0 ${tone}`}>
      <div className="flex items-baseline justify-between gap-1 mb-1.5 flex-wrap">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{pos}柱</span>
        <span className="flex items-baseline gap-1 text-[10px] tabular-nums">
          <span className="text-emerald-700 dark:text-emerald-400">合{cross.he.length}</span>
          <span className="text-rose-700 dark:text-rose-400">冲{cross.chong.length}</span>
          <span className="text-amber-700 dark:text-amber-400">刑{cross.xinghaipo.length}</span>
          <span className="text-amber-700 dark:text-amber-400">克{cross.ke.length}</span>
        </span>
      </div>
      {cross.total === 0 ? (
        <div className="text-[11px] text-slate-400 dark:text-slate-600 italic">无</div>
      ) : (
        <div className="flex flex-col gap-1">
          {[...cross.he, ...cross.chong, ...cross.xinghaipo, ...cross.ke].map((f, i) => (
            <FindingChip key={`${f.kind}-${f.positions}-${i}`} f={f} />
          ))}
        </div>
      )}
    </div>
  )
}

function FindingChip({ f }: { f: AnyFinding }) {
  return (
    <div className={`rounded-md border px-1.5 py-0.5 text-[10px] leading-snug min-w-0 ${KIND_TONE[f.kind]}`}>
      <div className="flex items-baseline gap-1 flex-wrap min-w-0">
        <span className="text-[9px] opacity-70">{f.kind}</span>
        <span className="font-bold truncate">{f.name}</span>
      </div>
      <div className="text-[9px] opacity-70 truncate">[{f.positions}]</div>
    </div>
  )
}
