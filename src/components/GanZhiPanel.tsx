import { useState } from 'react'
import { analyzeGanZhi, type Finding, type FindingKind } from '@/lib'
import { useShiShen } from '@@/stores'
import { SkillLink } from '@@/SkillLink'

const SECTION_LABEL = 'text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 uppercase'

/** 每类 finding 的色调 */
const KIND_TONE: Record<FindingKind, string> = {
  天干五合: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  地支六合: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  地支三合: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  半三合: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  拱合: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  地支三会: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  天干相冲: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  地支六冲: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  地支三刑: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  自刑: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  天干相克: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  地支相害: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  地支相破: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  地支相绝: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  争合: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  妒合: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  墓库: 'border-indigo-500/40 bg-indigo-500/5 text-indigo-700 dark:text-indigo-400',
}

export function GanZhiPanel() {
  const pillars = useShiShen((s) => s.result.pillars)
  const [open, setOpen] = useState(true)
  const a = analyzeGanZhi(pillars)
  if (!a) return null

  const hetotal = a.tianganHe.length + a.liuhe.length + a.sanhe.length + a.sanhui.length
  const chongtotal = a.tianganChong.length + a.chong.length
  const xinghaiototal = a.xing.length + a.hai.length + a.po.length + a.jue.length

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
          <span className="text-indigo-700 dark:text-indigo-400">库 {a.muku.length}</span>
        </div>
      </button>

      {open && (
        <div className="space-y-5 text-sm">
          {/* 合 */}
          <Section label="① 合 · 天干五合 / 地支六合 / 三合 / 三会">
            <FindingList list={[...a.tianganHe, ...a.liuhe, ...a.sanhe, ...a.sanhui]} />
          </Section>

          {/* 冲 */}
          <Section label="② 冲 · 天干相冲 / 地支六冲">
            <FindingList list={[...a.tianganChong, ...a.chong]} />
          </Section>

          {/* 刑 */}
          <Section label="③ 刑 · 三刑 / 自刑">
            <FindingList list={a.xing} />
          </Section>

          {/* 害 */}
          <Section label="④ 害 (穿) · 六害">
            <FindingList list={a.hai} />
          </Section>

          {/* 克 / 破 / 绝 */}
          <Section label="⑤ 克 / 破 / 绝">
            <FindingList list={[...a.tianganKe, ...a.po, ...a.jue]} />
          </Section>

          {/* 墓库 */}
          <Section label="⑥ 墓库 · 开 / 闭 / 静">
            <FindingList list={a.muku} />
          </Section>

          {/* 来源 */}
          <div className="text-[10px] text-slate-400 dark:text-slate-600 text-right leading-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            依 天干地支/合 · 冲 · 克 · 刑 · 会 · 墓库 md · 定性判断，不加权打分
            <br />
            md 明文：三会 &gt; 三合 &gt; 六合 &gt; 六冲 &gt; 三刑 &gt; 六害 &gt; 六破 &gt; 相绝 · 合冲同现需人工裁断
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

function FindingList({ list }: { list: Finding[] }) {
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

function FindingRow({ f }: { f: Finding }) {
  return (
    <div className={`rounded-md border px-2.5 py-1.5 text-xs leading-relaxed ${KIND_TONE[f.kind]}`}>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-[10px] opacity-70 font-medium">{f.kind}</span>
        <span className="font-bold text-sm">
          {f.mdKey ? (
            <SkillLink category="jichu" name={f.mdKey} className="underline decoration-dotted">{f.name}</SkillLink>
          ) : (
            f.name
          )}
        </span>
        <span className="text-[10px] opacity-80 tabular-nums">[{f.positions}{f.close ? ' · 紧贴' : ''}]</span>
        <span className="ml-auto text-[11px] font-medium">
          {f.state}
          {f.transformed !== undefined && (
            <span className={f.transformed ? 'ml-1 text-emerald-700 dark:text-emerald-400' : 'ml-1 opacity-60'}>
              {f.transformed ? '✓化' : '未化'}
            </span>
          )}
        </span>
      </div>
      {f.note && (
        <div className="text-[10px] opacity-80 mt-0.5">{f.note}</div>
      )}
    </div>
  )
}
