import { useMemo, useState } from 'react'
import {
  analyzeGanZhi,
  ganWuxing,
  zhiWuxing,
  wuxingRelations,
  isYangGan,
  CANG_GAN,
  type ConflictFinding,
  type Gan,
  type GanZhiAnalysis,
  type HeFinding,
  type Zhi,
  type WuXing,
} from '@jabberwocky238/bazi-engine'
import { type Pillar, useBazi } from '@/lib'
import { useBaziStore, type ExtraPillar } from '@@/stores'
import { WUXING_BG_STRONG, WUXING_BG_SOFT, WUXING_BORDER, WUXING_TEXT } from '@@/css'
import { SkillLink } from '@@/SkillLink'

// —— 五行关系小子表（依日主） ——
type RelationKey = '同类' | '我生' | '我克' | '克我' | '生我'
const REL_ROWS: { relation: RelationKey; category: '比劫' | '印' | '食伤' | '财' | '官杀'; shishens: [string, string] }[] = [
  { relation: '同类', category: '比劫', shishens: ['比肩', '劫财'] },
  { relation: '我生', category: '食伤', shishens: ['食神', '伤官'] },
  { relation: '我克', category: '财',   shishens: ['偏财', '正财'] },
  { relation: '克我', category: '官杀', shishens: ['七杀', '正官'] },
  { relation: '生我', category: '印',   shishens: ['偏印', '正印'] },
]
const WUXING_TO_GANS: Record<string, { yang: string; yin: string }> = {
  木: { yang: '甲', yin: '乙' },
  火: { yang: '丙', yin: '丁' },
  土: { yang: '戊', yin: '己' },
  金: { yang: '庚', yin: '辛' },
  水: { yang: '壬', yin: '癸' },
}

// —— 权重配置 ——
const GAN_WEIGHT = 1.0
const HIDDEN_WEIGHTS = [0.6, 0.3, 0.1]
const HE_TRANSFER = 0.5
const CHONG_PENALTY = 0.5
const KE_PENALTY = 0.2
const XING_PENALTY = 0.2
const HAI_PENALTY = 0.2
const PO_PENALTY = 0.1

const WUXINGS: WuXing[] = ['木', '火', '土', '金', '水']
const POS_LABELS = '年月日时'

type Cat = '比劫' | '印' | '食伤' | '财' | '官杀'
const CAT_REP_SHISHEN: Record<Cat, string> = {
  比劫: '比肩', 印: '正印', 食伤: '食神', 财: '正财', 官杀: '正官',
}

function wxToCat(rel: ReturnType<typeof wuxingRelations>, w: WuXing): Cat | null {
  if (rel.同类 === w) return '比劫'
  if (rel.生我 === w) return '印'
  if (rel.我生 === w) return '食伤'
  if (rel.我克 === w) return '财'
  if (rel.克我 === w) return '官杀'
  return null
}

function parseHuaWx(s: string): WuXing | null {
  const m = s.match(/[合会化][^木火土金水]*([木火土金水])/)
  return m ? (m[1] as WuXing) : null
}

function constituents(
  positions: string,
  isGanKind: boolean,
  pillars: Pillar[],
): { wx: WuXing; ss: string }[] {
  const out: { wx: WuXing; ss: string }[] = []
  for (const ch of positions) {
    const i = POS_LABELS.indexOf(ch)
    if (i < 0) continue
    const p = pillars[i]
    if (!p) continue
    if (isGanKind) {
      const wx = ganWuxing(p.gan as Gan) as WuXing | undefined
      if (wx) out.push({ wx, ss: p.shishen })
    } else {
      const wx = zhiWuxing(p.zhi as Zhi) as WuXing | undefined
      if (wx) out.push({ wx, ss: p.hideShishen[0] ?? '' })
    }
  }
  return out
}

interface Adjustment {
  source: '原局' | '岁运'
  category: '合化' | '冲' | '克' | '刑害' | '破' | '化解'
  desc: string
}

interface Computed {
  wxWeight: Record<WuXing, number>
  ssWeight: Record<string, number>
  ssOrder: string[]
  ssGroup: Record<string, '透干' | '藏干' | '化气'>
  adjustments: Adjustment[]
}

const HE_KINDS = ['天干五合', '地支六合', '地支三合', '地支三会'] as const satisfies readonly (keyof GanZhiAnalysis)[]
const CONFLICTS: { kind: keyof GanZhiAnalysis; penalty: number; cat: Adjustment['category'] }[] = [
  { kind: '天干相冲', penalty: CHONG_PENALTY, cat: '冲' },
  { kind: '天干相克', penalty: KE_PENALTY, cat: '克' },
  { kind: '地支相冲', penalty: CHONG_PENALTY, cat: '冲' },
  { kind: '地支相刑', penalty: XING_PENALTY, cat: '刑害' },
  { kind: '地支相害', penalty: HAI_PENALTY, cat: '刑害' },
  { kind: '地支相破', penalty: PO_PENALTY, cat: '破' },
]

function compute(pillars: Pillar[], extras: ExtraPillar[], dayGan: string): Computed | null {
  if (!dayGan || pillars.length !== 4) return null
  const rel = wuxingRelations(dayGan as Gan)
  const wxW: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  const ssW: Record<string, number> = {}
  const ssOrder: string[] = []
  const ssGroup: Record<string, '透干' | '藏干' | '化气'> = {}
  const ensureSs = (s: string, g: '透干' | '藏干' | '化气') => {
    if (!s || s === '日主') return
    if (!(s in ssW)) {
      ssW[s] = 0
      ssOrder.push(s)
      ssGroup[s] = g
    } else if (g === '透干' && ssGroup[s] === '藏干') {
      ssGroup[s] = '透干'
    }
  }
  const ingest = (gan: string, hideGans: string[], ganShishen: string, hideShishen: string[]) => {
    if (gan && ganShishen && ganShishen !== '日主') {
      const wx = ganWuxing(gan as Gan) as WuXing | undefined
      if (wx) wxW[wx] += GAN_WEIGHT
      ensureSs(ganShishen, '透干'); ssW[ganShishen] += GAN_WEIGHT
    }
    hideGans.forEach((g, i) => {
      const ss = hideShishen[i]
      if (!g || !ss || ss === '日主') return
      const w = HIDDEN_WEIGHTS[i] ?? 0.05
      const wx = ganWuxing(g as Gan) as WuXing | undefined
      if (wx) wxW[wx] += w
      ensureSs(ss, '藏干'); ssW[ss] += w
    })
  }
  pillars.forEach((p) => ingest(p.gan, p.hideGans, p.shishen, p.hideShishen))
  extras.forEach((e) => {
    const cangs = (CANG_GAN[e.zhi as Zhi] ?? []) as string[]
    ingest(e.gan, cangs, e.shishen, e.hideShishen)
  })

  const adjustments: Adjustment[] = []
  const penalize = (cs: { wx: WuXing; ss: string }[], each: number) => {
    for (const c of cs) {
      wxW[c.wx] = Math.max(0, (wxW[c.wx] ?? 0) - each)
      if (c.ss && c.ss !== '日主') {
        ssW[c.ss] = Math.max(0, (ssW[c.ss] ?? 0) - each)
      }
    }
  }
  const transferIn = (huaWx: WuXing, amount: number) => {
    wxW[huaWx] += amount
    const cat = wxToCat(rel, huaWx)
    if (!cat) return
    const rep = CAT_REP_SHISHEN[cat]
    if (!(rep in ssW)) {
      ssW[rep] = 0
      ssOrder.push(rep)
      ssGroup[rep] = '化气'
    }
    ssW[rep] += amount
  }

  const a = analyzeGanZhi(
    pillars,
    extras.map((e) => ({ label: e.label, gan: e.gan, zhi: e.zhi, gz: e.gz })),
  )
  if (!a) return { wxWeight: wxW, ssWeight: ssW, ssOrder, ssGroup, adjustments }

  // —— 原局合化 (impacted 不影响化气计入, 只在视图上标注) ——
  for (const k of HE_KINDS) {
    for (const f of a[k] as HeFinding[]) {
      if (!f.transformed) continue
      const huaWx = parseHuaWx(f.state) ?? parseHuaWx(f.name)
      if (!huaWx) continue
      const cs = constituents(f.positions, k.startsWith('天干'), pillars)
      if (cs.length < 2) continue
      penalize(cs, HE_TRANSFER)
      transferIn(huaWx, HE_TRANSFER * cs.length)
      adjustments.push({
        source: '原局', category: '合化',
        desc: `${f.name}（${f.positions}）→ ${huaWx} +${(HE_TRANSFER * cs.length).toFixed(1)}`,
      })
    }
  }

  // —— 原局冲克刑害破 (有 dissolved 视为岁运化解, 跳过扣分) ——
  for (const { kind, penalty, cat } of CONFLICTS) {
    for (const f of a[kind] as ConflictFinding[]) {
      const dissolvedBy = f.dissolved ?? []
      if (dissolvedBy.length > 0) {
        const via = dissolvedBy.map((d) => `${d.by.label}${d.by.gz}`).join('、')
        adjustments.push({
          source: '岁运', category: '化解',
          desc: `${f.name}（${f.positions}）— ${via} 引化, 效力消解`,
        })
        continue
      }
      const cs = constituents(f.positions, kind.startsWith('天干'), pillars)
      if (!cs.length) continue
      penalize(cs, penalty)
      adjustments.push({
        source: '原局', category: cat,
        desc: `${f.name}（${f.positions}）→ -${penalty.toFixed(1)} 各方`,
      })
    }
  }

  return { wxWeight: wxW, ssWeight: ssW, ssOrder, ssGroup, adjustments }
}

// —— 视图 ——

const ADJ_TONE: Record<Adjustment['category'], string> = {
  合化: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  冲: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  克: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  刑害: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  破: 'border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  化解: 'border-slate-300 bg-slate-100/40 text-slate-500 dark:border-slate-700 dark:bg-slate-900/30 dark:text-slate-400 line-through',
}

function huaWxOfShishen(
  r: ReturnType<typeof wuxingRelations> | null,
  shishen: string,
): string {
  if (!r) return ''
  switch (shishen) {
    case '比肩':
    case '劫财': return r.同类
    case '正印':
    case '偏印': return r.生我
    case '食神':
    case '伤官': return r.我生
    case '正财':
    case '偏财': return r.我克
    case '正官':
    case '七杀': return r.克我
    default: return ''
  }
}

export function ElementsPanel() {
  const pillars = useBazi((s) => s.pillars)
  const dayGan = useBazi((s) => s.dayGan)
  const extras = useBaziStore((s) => s.extraPillars)
  const setExtras = useBaziStore((s) => s.setExtraPillars)
  const [open, setOpen] = useState(true)
  const [showAdj, setShowAdj] = useState(false)

  const data = useMemo(
    () => compute(pillars, extras, dayGan),
    [pillars, extras, dayGan],
  )
  if (!data) return null

  const rel = dayGan ? wuxingRelations(dayGan as Gan) : null

  const wxTotal = WUXINGS.reduce((s, w) => s + (data.wxWeight[w] ?? 0), 0)

  const ssTotal = data.ssOrder.reduce((s, n) => s + (data.ssWeight[n] ?? 0), 0)
  const ssBars = data.ssOrder
    .filter((n) => (data.ssWeight[n] ?? 0) > 0)
    .map((n) => ({
      name: n,
      weight: data.ssWeight[n] ?? 0,
      pct: ssTotal > 0 ? ((data.ssWeight[n] ?? 0) / ssTotal) * 100 : 0,
      group: data.ssGroup[n] ?? '透干',
      wuxing: huaWxOfShishen(rel, n),
    }))

  const inGan = ssBars.filter((e) => e.group === '透干').sort((a, b) => b.weight - a.weight)
  const hidden = ssBars.filter((e) => e.group === '藏干').sort((a, b) => b.weight - a.weight)
  const transformed = ssBars.filter((e) => e.group === '化气').sort((a, b) => b.weight - a.weight)

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
            五行 · 十神 占比
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
          {/* 五行 · 关系 + 占比 (合并后的视图) */}
          {rel && dayGan && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
                <span>五行 · 关系 + 占比</span>
                <span className="flex items-center gap-1.5 ml-2 normal-case tracking-normal">
                  <span className="text-slate-500 dark:text-slate-400">日主</span>
                  <span
                    className={[
                      'inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-base border',
                      WUXING_TEXT[ganWuxing(dayGan as Gan) ?? ''] ?? '',
                      WUXING_BG_SOFT[ganWuxing(dayGan as Gan) ?? ''] ?? '',
                      WUXING_BORDER[ganWuxing(dayGan as Gan) ?? ''] ?? '',
                    ].join(' ')}
                  >
                    {dayGan}
                  </span>
                  <span className={`text-xs font-medium ${WUXING_TEXT[ganWuxing(dayGan as Gan) ?? ''] ?? ''}`}>
                    {isYangGan(dayGan as Gan) ? '阳' : '阴'}{ganWuxing(dayGan as Gan)}
                  </span>
                </span>
                <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-600 normal-case tracking-normal">
                  已计入合化 / 冲克 / 刑害
                </span>
              </div>
              <div className="space-y-1.5">
                {REL_ROWS.map((row) => {
                  const target = rel[row.relation]
                  const tText = WUXING_TEXT[target] ?? ''
                  const dayYang = isYangGan(dayGan as Gan)
                  const pair = WUXING_TO_GANS[target]
                  const sameGan = pair ? (dayYang ? pair.yang : pair.yin) : ''
                  const diffGan = pair ? (dayYang ? pair.yin : pair.yang) : ''
                  const weight = data.wxWeight[target] ?? 0
                  const pct = wxTotal > 0 ? (weight / wxTotal) * 100 : 0
                  const barColor = WUXING_BG_STRONG[target] ?? 'bg-slate-400'
                  return (
                    <div
                      key={row.relation}
                      className="flex items-center gap-2 md:gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <span className="w-9 shrink-0 text-[11px] text-slate-500 dark:text-slate-400 tracking-wider">
                        {row.relation}
                      </span>
                      <span className={`w-5 text-center font-bold text-sm md:text-base shrink-0 ${tText}`}>
                        {target}
                      </span>
                      <span className={`w-9 md:w-10 text-xs md:text-sm font-medium shrink-0 ${tText}`}>
                        {row.category}
                      </span>
                      <span className="hidden sm:flex items-center gap-2 md:gap-3 shrink-0">
                        <RelGanShishen gan={sameGan} shishen={row.shishens[0]} wuxing={target} />
                        <RelGanShishen gan={diffGan} shishen={row.shishens[1]} wuxing={target} />
                      </span>
                      <div className="flex-1 min-w-0 relative h-3.5 md:h-4 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`absolute inset-y-0 left-0 ${barColor} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-12 md:w-14 shrink-0 text-right text-xs tabular-nums text-slate-600 dark:text-slate-400">
                        {pct.toFixed(1)}%
                      </div>
                      <div className="hidden sm:block w-10 shrink-0 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
                        w {weight.toFixed(2)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 十神 · 透干 */}
          {inGan.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
                十神 · 透干
              </div>
              <div className="space-y-2">
                {inGan.map((b) => (
                  <Bar key={b.name} label={b.name} pct={b.pct} weight={b.weight} wuxing={b.wuxing} category="shishen" />
                ))}
              </div>
            </div>
          )}

          {/* 十神 · 仅藏干 */}
          {hidden.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
                十神 · 仅藏干
              </div>
              <div className="space-y-2">
                {hidden.map((b) => (
                  <Bar key={b.name} label={b.name} pct={b.pct} weight={b.weight} wuxing={b.wuxing} category="shishen" dimmed />
                ))}
              </div>
            </div>
          )}

          {/* 十神 · 化气 */}
          {transformed.length > 0 && (
            <div className="mt-5">
              <div className="mb-2 text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
                十神 · 化气
              </div>
              <div className="space-y-2">
                {transformed.map((b) => (
                  <Bar key={b.name} label={b.name} pct={b.pct} weight={b.weight} wuxing={b.wuxing} category="shishen" />
                ))}
              </div>
            </div>
          )}

          {/* 影响明细 — 默认收起 */}
          {data.adjustments.length > 0 && (
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAdj((v) => !v)}
                aria-expanded={showAdj}
                className="w-full flex items-center gap-2 text-left text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400"
              >
                <span className={`text-[11px] inline-block transition-transform ${showAdj ? 'rotate-90' : ''}`}>▸</span>
                <span>合冲刑害 · 影响明细</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-600 normal-case tracking-normal">
                  {data.adjustments.length} 项 · 点击{showAdj ? '收起' : '展开'}
                </span>
              </button>
              {showAdj && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {data.adjustments.map((a, i) => (
                    <div
                      key={i}
                      className={`text-xs px-2 py-1 rounded border ${ADJ_TONE[a.category]}`}
                    >
                      <span className="text-[10px] opacity-70 mr-1">[{a.source}·{a.category}]</span>
                      {a.desc}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function RelGanShishen({ gan, shishen, wuxing }: { gan: string; shishen: string; wuxing: string }) {
  const wxText = WUXING_TEXT[wuxing] ?? ''
  return (
    <span className="inline-flex items-center gap-1">
      <SkillLink category="tiangan" name={gan}>
        <span className={`font-bold text-sm md:text-base ${wxText}`}>{gan}</span>
      </SkillLink>
      <SkillLink category="shishen" name={shishen}>
        <span className={`text-[11px] md:text-xs ${wxText}`}>{shishen}</span>
      </SkillLink>
    </span>
  )
}

interface BarProps {
  label: string
  pct: number
  weight: number
  wuxing: string
  category: 'wuxing' | 'shishen'
  dimmed?: boolean
}

function Bar({ label, pct, weight, wuxing, category, dimmed }: BarProps) {
  const barColor = WUXING_BG_STRONG[wuxing] ?? 'bg-slate-400'
  const textColor = WUXING_TEXT[wuxing] ?? ''
  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className={`w-10 md:w-14 shrink-0 text-sm font-medium ${textColor}`}>
        {category === 'shishen' ? (
          <SkillLink category="shishen" name={label}>{label}</SkillLink>
        ) : (
          <span>{label}</span>
        )}
      </div>
      <div className="flex-1 min-w-0 relative h-4 md:h-5 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 ${barColor} ${dimmed ? 'opacity-70' : ''} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="w-12 md:w-14 shrink-0 text-right text-xs tabular-nums text-slate-600 dark:text-slate-400">
        {pct.toFixed(1)}%
      </div>
      <div className="hidden sm:block w-10 shrink-0 text-right text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
        w {weight.toFixed(2)}
      </div>
    </div>
  )
}
