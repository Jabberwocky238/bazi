import { useState } from 'react'
import { useStrength, type StrengthLevel } from '@/lib'
import { WUXING_TEXT, WUXING_BG_SOFT, WUXING_BORDER } from '@@/css'
import { SkillLink } from '@@/SkillLink'

const LEVEL_COLOR: Record<StrengthLevel, string> = {
  身极旺: 'text-rose-700 dark:text-rose-400',
  身旺:   'text-rose-600 dark:text-rose-400',
  身中强: 'text-amber-600 dark:text-amber-400',
  '身中(偏强)': 'text-emerald-600 dark:text-emerald-400',
  '身中(偏弱)': 'text-emerald-600 dark:text-emerald-400',
  身略弱: 'text-sky-600 dark:text-sky-400',
  身弱:   'text-indigo-600 dark:text-indigo-400',
  身极弱: 'text-indigo-700 dark:text-indigo-400',
  近从弱: 'text-purple-700 dark:text-purple-400',
}

const POINT_POS = 'text-emerald-600 dark:text-emerald-400 tabular-nums'
const POINT_NEG = 'text-rose-600 dark:text-rose-400 tabular-nums'

function ptClass(n: number) { return n > 0 ? POINT_POS : n < 0 ? POINT_NEG : 'text-slate-400 tabular-nums' }
function signed(n: number) { return n > 0 ? `+${n}` : `${n}` }

export function StrengthPanel() {
  const a = useStrength((s) => s.analysis)
  const [open, setOpen] = useState(true)
  if (!a) return null

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
            身强弱分析
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-slate-600">
            {open ? '点击收起' : '点击展开'}
          </span>
        </span>
        <div className="flex items-baseline gap-2 text-sm">
          <span className={`font-semibold text-base ${LEVEL_COLOR[a.level]}`}>{a.level}</span>
          <span className="text-slate-500 tabular-nums">S = {a.score}</span>
        </div>
      </button>

      {open && (
        <div className="space-y-3 text-sm">
          {/* 日主 */}
          <Row label="日主">
            <span
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold border ${WUXING_TEXT[a.dayWx]} ${WUXING_BG_SOFT[a.dayWx]} ${WUXING_BORDER[a.dayWx]}`}
            >
              {a.dayGan}
            </span>
            <span className={`font-medium ${WUXING_TEXT[a.dayWx]}`}>{a.dayWx}</span>
          </Row>

          {/* 得令 */}
          <Row label="得令">
            <span className={a.deLing ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {a.deLing ? '✓' : '✗'}
            </span>
            <span className="text-slate-600 dark:text-slate-400 flex-1">{a.deLingNote}</span>
            <span className={ptClass(a.deLingPoints)}>{signed(a.deLingPoints)}</span>
          </Row>

          {/* 得地 (四柱根) */}
          <div>
            <div className="text-[11px] tracking-wider font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              得地 · 地支根
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {a.roots.map((r) => (
                <div
                  key={r.pos}
                  className={`rounded border px-2 py-1.5 text-center ${
                    r.kind === 'none'
                      ? 'border-slate-200 dark:border-slate-700 text-slate-400'
                      : 'border-emerald-400/40 bg-emerald-500/5'
                  }`}
                >
                  <div className="text-[10px] text-slate-500">{r.pos}支 {r.zhi}</div>
                  <div className={`text-xs font-medium ${r.kind === 'none' ? '' : 'text-emerald-700 dark:text-emerald-400'}`}>
                    {r.label}
                  </div>
                  <div className={`text-xs ${ptClass(r.points)}`}>{signed(r.points)}</div>
                </div>
              ))}
            </div>
            <div className="mt-1.5 text-right text-xs text-slate-500">
              根分小计 <span className={ptClass(a.rootPoints)}>{signed(a.rootPoints)}</span>
            </div>
          </div>

          {/* 天干 */}
          <div>
            <div className="text-[11px] tracking-wider font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              得生 / 得助 · 天干 (除日干)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {a.ganContribs.map((c) => (
                <span
                  key={c.pos}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs ${
                    c.isSelf
                      ? 'border-emerald-400/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
                      : 'border-rose-400/40 bg-rose-500/5 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  <span className="text-[10px] opacity-70">{c.pos}干</span>
                  <span className="font-bold">{c.gan}</span>
                  <SkillLink category="shishen" name={c.shishen} className="">
                    {c.shishen}
                  </SkillLink>
                  <span className={ptClass(c.points)}>{signed(c.points)}</span>
                </span>
              ))}
            </div>
            <div className="mt-1.5 text-right text-xs text-slate-500">
              天干分小计 <span className={ptClass(a.ganPoints)}>{signed(a.ganPoints)}</span>
            </div>
          </div>

          {/* 修正 */}
          {a.correction !== 0 && (
            <Row label="修正">
              <span className="flex-1 text-slate-600 dark:text-slate-400">{a.correctionNote}</span>
              <span className={ptClass(a.correction)}>{signed(a.correction)}</span>
            </Row>
          )}

          {/* 总分 */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
            <span className="text-[11px] tracking-wider text-slate-500 dark:text-slate-400">
              S = 得令 + 根 + 天干 + 修正
            </span>
            <span className="text-lg font-bold tabular-nums">
              {a.deLingPoints} {a.rootPoints >= 0 ? '+' : ''}{a.rootPoints}{' '}
              {a.ganPoints >= 0 ? '+' : ''}{a.ganPoints}
              {a.correction !== 0 && ` ${a.correction >= 0 ? '+' : ''}${a.correction}`}
              {' = '}
              <span className={LEVEL_COLOR[a.level]}>{a.score}</span>
            </span>
          </div>

          <div className="text-[10px] text-slate-400 dark:text-slate-600 text-right leading-5">
            依《子平真诠》《滴天髓》《三命通会》 ·
            <SkillLink category="jichu" name="推断逻辑" className="ml-1 underline">推断逻辑</SkillLink>
            <span className="mx-1">／</span>
            <SkillLink category="jichu" name="旺衰判断流程" className="underline">旺衰判断流程</SkillLink>
            <span className="mx-1">／</span>
            <SkillLink category="jichu" name="旺衰理论" className="underline">旺衰理论</SkillLink>
            <br />
            未计入人元司令修正 · 合冲刑害需人工再审
          </div>
        </div>
      )}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-10 shrink-0 text-[11px] tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </div>
  )
}
