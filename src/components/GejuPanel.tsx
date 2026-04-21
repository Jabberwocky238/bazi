import { useMemo, useState } from 'react'
import {
  CANG_GAN,
  ganWuxing,
  zhiWuxing,
  zizuoState,
  type Gan,
  type WuXing,
} from '@jabberwocky238/bazi-engine'
import {
  type Pillar,
  type PillarType,
  detectGeju,
  shishenWuxing,
  type GejuQuality,
  type GejuCategory,
  type GejuOutput,
  skillNames,
} from '@/lib'
import { useBaziStore, type ExtraPillar } from '@@/stores'
import { SkillLink } from '@@/SkillLink'

/** 边框 + 底色 + 发光色：表示吉凶。`--glow-color` 覆盖 SkillLink 的 hover 圆边光 */
const QUALITY_BORDER: Record<GejuQuality, string> = {
  good: 'border-emerald-500/60 bg-emerald-500/5 [--glow-color:#10b981]',
  bad: 'border-rose-500/60 bg-rose-500/5 [--glow-color:#f43f5e]',
  neutral: 'border-slate-400/50 bg-slate-400/5 [--glow-color:#94a3b8]',
}

/** 岁运破格 → 红 / 岁运激发(吉) → 绿 / 否则沿用 QUALITY_BORDER。 */
function hitBorderClass(h: GejuOutput): string {
  if (h.suiyunBreak) return 'border-red-500 bg-red-500/10 [--glow-color:#ef4444]'
  if (h.suiyunTrigger && h.quality === 'good')
    return 'border-emerald-500 bg-emerald-500/10 [--glow-color:#10b981]'
  return QUALITY_BORDER[h.quality]
}

function GejuChip({ hit }: { hit: GejuOutput }) {
  return (
    <SkillLink
      category="geju"
      name={hit.name}
      subtitle={hit.note}
      className={`text-sm px-3 py-1 rounded-full border-2 ${hitBorderClass(hit)} ${CATEGORY_TEXT[hit.category]}`}
    >
      {hit.name}
    </SkillLink>
  )
}

/** 字体颜色：表示所属类别 */
const CATEGORY_TEXT: Record<GejuCategory, string> = {
  正格: 'text-sky-700 dark:text-sky-400',
  从格: 'text-red-700 dark:text-red-400',
  十神格: 'text-emerald-700 dark:text-emerald-400',
  五行格: 'text-slate-500 dark:text-white',
  专旺格: 'text-purple-700 dark:text-purple-400',
  特殊格: 'text-amber-700 dark:text-amber-400',
}

const CATEGORY_ORDER: GejuCategory[] = ['五行格', '十神格', '正格', '专旺格', '特殊格', '从格']

/** 把 ExtraPillar 补齐成一个可喂给 detectGeju 的 Pillar。
 *  只补齐格局判定会用到的字段，其它（nayin/shensha）给空值。 */
function extraToPillar(e: ExtraPillar, dayGan: Gan): Pillar {
  const hideGans = (CANG_GAN[e.zhi] ?? []) as Gan[]
  const fallbackWx = ganWuxing(dayGan)
  return {
    label: e.label as PillarType,
    gan: e.gan,
    zhi: e.zhi,
    shishen: e.shishen,
    hideGans,
    hideShishen: e.hideShishen,
    nayin: '',
    ganWuxing: ganWuxing(e.gan),
    zhiWuxing: zhiWuxing(e.zhi),
    shishenWuxing: (shishenWuxing(dayGan, e.shishen) || fallbackWx) as WuXing,
    hideShishenWuxings: e.hideShishen.map(
      (s) => (shishenWuxing(dayGan, s) || fallbackWx) as WuXing,
    ),
    shensha: [],
    zizuo: zizuoState(e.gan, e.zhi),
  }
}

export function GejuPanel({ pillars }: { pillars: Pillar[] }) {
  const extras = useBaziStore((s) => s.extraPillars)
  const dayGan = pillars[2]?.gan as Gan | undefined

  const { hits, activeDaYun, activeLiuNian } = useMemo(() => {
    const dy = extras.find((e) => e.label === '大运')
    const ln = extras.find((e) => e.label === '流年')
    if (!dayGan) {
      return {
        hits: detectGeju(pillars),
        activeDaYun: null as ExtraPillar | null,
        activeLiuNian: null as ExtraPillar | null,
      }
    }
    return {
      hits: detectGeju(pillars, {
        dayun: dy ? extraToPillar(dy, dayGan) : undefined,
        liunian: ln ? extraToPillar(ln, dayGan) : undefined,
      }),
      activeDaYun: dy ?? null,
      activeLiuNian: ln ?? null,
    }
  }, [pillars, extras, dayGan])

  const hitSet = new Set(hits.map((h) => h.name))
  const others = skillNames('geju').filter((n) => !hitSet.has(n))
  const [showAll, setShowAll] = useState(false)
  const hasSuiyun = !!(activeDaYun || activeLiuNian)

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <span className="flex items-baseline gap-2">
          <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
            格局分析
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-slate-600">
            点击具体格局查看释义
          </span>
        </span>

        {/* 图例 */}
        <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-500/70" />吉
            <span className="inline-block w-3 h-3 rounded-full border-2 border-rose-500/70 ml-1" />凶
            <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-400/70 ml-1" />中性
          </div>
          <div className="flex items-center gap-2">
            {CATEGORY_ORDER.map((c) => (
              <span key={c} className={CATEGORY_TEXT[c]}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      {(() => {
        // 激发的岁运特定格局 → 算作"已成格"和原局归在一起
        const activeHits = hits.filter((h) => !h.suiyunSpecific || h.suiyunTrigger)
        const potentialHits = hits.filter((h) => h.suiyunSpecific && !h.suiyunTrigger)
        if (hits.length === 0) {
          return <p className="text-sm text-slate-500 dark:text-slate-400">未识别到明显格局</p>
        }
        return (
          <>
            <div>
              <div className="mb-2 text-[10px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
                原局
              </div>
              {activeHits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {activeHits.map((h) => (
                    <GejuChip key={h.name} hit={h} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-600">—</p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400">
                  需要岁运
                </span>
                {hasSuiyun ? (
                  <span className="flex items-center gap-1 text-[10px]">
                    {activeDaYun && (
                      <span className="px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        大运 {activeDaYun.gz}
                      </span>
                    )}
                    {activeLiuNian && (
                      <span className="px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                        流年 {activeLiuNian.gz}
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 dark:text-slate-600">
                    未选岁运 · 以下仅为原局推断的潜在格局
                  </span>
                )}
              </div>
              {potentialHits.length > 0 ? (
                <div className="flex flex-wrap gap-2 opacity-60">
                  {potentialHits.map((h) => (
                    <GejuChip key={h.name} hit={h} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-600">—</p>
              )}
            </div>
          </>
        )
      })()}

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="text-[11px] tracking-wider text-slate-500 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-400"
        >
          {showAll ? '收起全部格局 ▴' : `查看全部格局 (${others.length}) ▾`}
        </button>
        {showAll && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {others.map((n) => (
              <SkillLink
                key={n}
                category="geju"
                name={n}
                className="text-xs px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              >
                {n}
              </SkillLink>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-600 text-right">
        算法版本 v3，引入身强弱合干支计算，极为复杂和严苛，大幅降低成格概率，但由于格局变多，有所抵消
      </div>
    </section>
  )
}
