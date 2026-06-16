import type { Pillar } from '@/lib'
import { WUXING_BG_SOFT, WUXING_BORDER, WUXING_TEXT } from '@@/css'

const GENERATES: Record<string, string> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
const CONTROLS: Record<string, string> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

interface BaziChar {
  key: string
  label: string
  value: string
  wuxing: string
}

interface Relation {
  kind: '生' | '克'
  /** 从第一个字指向第二个字，或从第二个字指回第一个字。 */
  direction: 'forward' | 'backward'
}

function relationOf(a: BaziChar, b: BaziChar): Relation | null {
  if (!a.value || !b.value || !a.wuxing || !b.wuxing || a.wuxing === b.wuxing) return null
  if (GENERATES[a.wuxing] === b.wuxing) return { kind: '生', direction: 'forward' }
  if (CONTROLS[a.wuxing] === b.wuxing) return { kind: '克', direction: 'forward' }
  if (GENERATES[b.wuxing] === a.wuxing) return { kind: '生', direction: 'backward' }
  if (CONTROLS[b.wuxing] === a.wuxing) return { kind: '克', direction: 'backward' }
  return null
}

function arrowTone(kind: Relation['kind']): string {
  return kind === '生'
    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
    : 'border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300'
}

function HorizontalArrow({ relation }: { relation: Relation | null }) {
  const base = 'h-7 w-7 md:w-10 inline-flex items-center justify-center gap-0.5 rounded-full border px-1 text-[10px] md:text-[11px] font-medium'
  if (!relation) return <div className={`${base} invisible`} aria-hidden="true" />
  return (
    <div className={`${base} ${arrowTone(relation.kind)}`}>
      <span>{relation.direction === 'forward' ? '→' : '←'}</span>
      <span>{relation.kind}</span>
    </div>
  )
}

function VerticalArrow({ relation }: { relation: Relation | null }) {
  const base = 'h-8 w-7 md:w-10 inline-flex items-center justify-center gap-0.5 rounded-full border px-1 text-[10px] md:text-[11px] font-medium'
  if (!relation) return <div className={`${base} invisible`} aria-hidden="true" />
  return (
    <div className={`${base} ${arrowTone(relation.kind)}`}>
      <span>{relation.direction === 'forward' ? '↓' : '↑'}</span>
      <span>{relation.kind}</span>
    </div>
  )
}

function CharBlock({ item }: { item: BaziChar }) {
  const empty = !item.value
  return (
    <div
      className={[
        'rounded-xl border px-1.5 py-2 text-center shadow-sm md:px-2.5',
        empty
          ? 'border-slate-200 bg-slate-50 text-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-700'
          : `${WUXING_BORDER[item.wuxing] ?? 'border-slate-200'} ${WUXING_BG_SOFT[item.wuxing] ?? 'bg-white'} bg-white/70 dark:bg-slate-950/40`,
      ].join(' ')}
    >
      <div className="text-[10px] tracking-[0.18em] text-slate-400 dark:text-slate-500">{item.label}</div>
      <div className={`mt-0.5 text-2xl font-bold leading-none ${WUXING_TEXT[item.wuxing] ?? ''}`}>
        {item.value || '—'}
      </div>
      <div className={`mt-1 text-[11px] font-medium ${WUXING_TEXT[item.wuxing] ?? 'text-slate-400'}`}>
        {item.wuxing || '未知'}
      </div>
    </div>
  )
}

export function BaziRelationsPanel({ pillars }: { pillars: Pillar[] }) {
  if (pillars.length !== 4) return null
  const stems: BaziChar[] = pillars.map((p) => ({
    key: `${p.label}-gan`,
    label: `${p.label[0]}干`,
    value: p.gan,
    wuxing: p.ganWuxing,
  }))
  const branches: BaziChar[] = pillars.map((p) => ({
    key: `${p.label}-zhi`,
    label: `${p.label[0]}支`,
    value: p.zhi,
    wuxing: p.zhiWuxing,
  }))

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
          八字生克图
        </h2>
        <span className="text-[10px] text-slate-400 dark:text-slate-600">
          天干在上、地支在下；只显示横向相邻与柱内上下生克，绿为生、红为克，箭头指向受生/受克方
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_1.75rem_minmax(0,1fr)_1.75rem_minmax(0,1fr)_1.75rem_minmax(0,1fr)] items-center gap-x-1 gap-y-2 md:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)_2.5rem_minmax(0,1fr)_2.5rem_minmax(0,1fr)] md:gap-x-2">
        {stems.map((item, i) => (
          <div key={item.key} className="contents">
            <div style={{ gridColumn: i * 2 + 1, gridRow: 1 }}>
              <CharBlock item={item} />
            </div>
            {i < stems.length - 1 && (
              <div style={{ gridColumn: i * 2 + 2, gridRow: 1 }} className="flex justify-center">
                <HorizontalArrow relation={relationOf(item, stems[i + 1])} />
              </div>
            )}
          </div>
        ))}

        {stems.map((item, i) => (
          <div key={`${item.key}-vertical`} style={{ gridColumn: i * 2 + 1, gridRow: 2 }} className="flex justify-center">
            <VerticalArrow relation={relationOf(item, branches[i])} />
          </div>
        ))}

        {branches.map((item, i) => (
          <div key={item.key} className="contents">
            <div style={{ gridColumn: i * 2 + 1, gridRow: 3 }}>
              <CharBlock item={item} />
            </div>
            {i < branches.length - 1 && (
              <div style={{ gridColumn: i * 2 + 2, gridRow: 3 }} className="flex justify-center">
                <HorizontalArrow relation={relationOf(item, branches[i + 1])} />
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
