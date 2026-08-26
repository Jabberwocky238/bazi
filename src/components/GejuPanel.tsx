import { useEffect, useState } from 'react'
import {
  PillarC,
  type Gan,
} from '@jabberwocky238/bazi-engine'
import {
  type Pillar,
  type PillarType,
  shishenWuxing,
  type GejuCategory,
  skillNames,
} from 'bazilib'
import type { GejuVerdict } from '@@/stores/geju'
import { useBaziStore, type ExtraPillar, useBazi } from '@@/stores'
import { SkillLink, type SkillItem } from '@@/SkillLink'

// 配色 —— 格局只有成与不成, 无吉凶:
//   原局成格         border-emerald-500 + bg-emerald-500/10
//   岁运补成 (隐)     同色淡显 (原局未成, 靠大运/流年补齐)
//   岁运破格         border-red-500 + bg-red-500/15 (覆盖以上)
const FORMED = 'border-emerald-500 bg-emerald-500/10 [--glow-color:#10b981]'
const PENDING = 'border-emerald-500/30 bg-emerald-500/5 [--glow-color:#10b981]'
const BROKEN = 'border-red-500 bg-red-500/15 [--glow-color:#ef4444]'

function hitBorderClass(h: GejuVerdict): string {
  if (h.成 && h.破.length > 0) return BROKEN
  return h.成 ? FORMED : PENDING
}

/** 专旺格的变体家族 —— 点击 chip 先列出全部变体, 再选看详情 (multiple 模式)。 */
const ZHUANWANG_FAMILY: SkillItem[] = [
  { category: 'geju', name: '专旺格' },
  { category: 'geju', name: '曲直格' },
  { category: 'geju', name: '炎上格' },
  { category: 'geju', name: '稼穑格' },
  { category: 'geju', name: '从革格' },
  { category: 'geju', name: '润下格' },
]

function GejuChip({ hit }: { hit: GejuVerdict }) {
  const display = hit.name
  const chipCls = `text-sm px-3 py-1 rounded-full border-2 ${hitBorderClass(hit)} ${CATEGORY_TEXT[hit.category]}`

  // 专旺格: 以 multiple 列出其变体家族
  if (hit.name === '专旺格') {
    return (
      <SkillLink items={ZHUANWANG_FAMILY} listTitle="专旺格" className={chipCls}>
        {display}
      </SkillLink>
    )
  }

  return (
    <SkillLink
      category="geju"
      name={hit.name}
      subtitle={hit.破.length > 0 ? `岁运破: ${hit.破.map((r) => r.why).join('; ')}` : undefined}
      className={chipCls}
    >
      {display}
    </SkillLink>
  )
}

/** 字体颜色：表示所属类别 */
const CATEGORY_TEXT: Record<GejuCategory, string> = {
  正格: 'text-emerald-700 dark:text-emerald-400',
  从格: 'text-red-700 dark:text-red-400',
  十神格: 'text-sky-700 dark:text-sky-400',
  五行格: 'text-slate-500 dark:text-white',
  专旺格: 'text-amber-700 dark:text-amber-400',
  特殊格: 'text-purple-700 dark:text-purple-400',
}

const CATEGORY_ORDER: GejuCategory[] = ['五行格', '正格', '十神格', '特殊格', '专旺格', '从格']

/** 把 ExtraPillar 补齐成一个可喂给 detectGeju 的 Pillar。
 *  十神不再挂在柱上 (由 Calculator.shishen() 提供), 故 e.shishen /
 *  e.hideShishen 在此不参与构造; 神煞岁运柱不计, 给空数组。 */
function extraToPillar(e: ExtraPillar, dayGan: Gan): Pillar {
  return {
    // 1.2.0: 干支收在 PillarC 里, 纳音由 pillar.nayinName() 自带;
    // changsheng 是 日干 vs 本柱地支 (非本柱干支对), 故另造一柱来取。
    pillar: PillarC.from(e.gan, e.zhi, e.label as PillarType),
    shensha: [],
    changsheng: PillarC.from(dayGan, e.zhi).changsheng(),
    isRizhu: false,
  }
}

export function GejuPanel() {
  const pillars = useBazi((s) => s.pillars)
  const geju = useBazi((s) => s.geju)
  const hits = geju.hits
  const setGejuExtras = useBazi((s) => s.setGejuExtras)
  const extras = useBaziStore((s) => s.extraPillars)
  const dayGan: Gan | undefined = pillars[2]?.pillar.gan.str

  const activeDaYun = extras.find((e) => e.label === '大运') ?? null
  const activeLiuNian = extras.find((e) => e.label === '流年') ?? null

  // 把 UI 选中的岁运 同步到 store → 触发 detectGeju 重算
  useEffect(() => {
    if (!dayGan) {
      setGejuExtras({})
      return
    }
    setGejuExtras({
      dayun: activeDaYun ? extraToPillar(activeDaYun, dayGan) : undefined,
      liunian: activeLiuNian ? extraToPillar(activeLiuNian, dayGan) : undefined,
    })
  }, [dayGan, activeDaYun, activeLiuNian, setGejuExtras])

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
        <div className="mb-3 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[10px] opacity-70">已引化:</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-500/10" />吉
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-rose-500 bg-rose-500/10" />凶
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-400 bg-slate-400/10" />中
            </span>
            <span className="text-[10px] opacity-70 ml-2">未引化:</span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-emerald-500/30 bg-emerald-500/5" />吉
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-rose-500/30 bg-rose-500/5" />凶
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-slate-400/30 bg-slate-400/5" />中
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[10px] opacity-70">类别:</span>
            {CATEGORY_ORDER.map((c) => (
              <span key={c} className={CATEGORY_TEXT[c]}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      {(() => {
        // 原局段 = 主局即成格
        const activeHits = hits.filter((h) => h.成)
        // 岁运有变段 = 原局未成, 靠岁运补齐
        const suiyunHits = hits.filter((h) => !h.成)
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
                  岁运有变
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
              {suiyunHits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {suiyunHits.map((h) => (
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

      <div data-copy-exclude className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
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

      <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-600 text-right leading-relaxed">
        算法版本 v5 · 原局成格 = 已引化 (深色); 岁运段需 默认成格 / 大运 / 流年 引化 才显深色, 否则淡色表"潜在可能"。
      </div>
    </section>
  )
}
