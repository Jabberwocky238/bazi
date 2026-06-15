import { useEffect, useState } from 'react'
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
  useBazi,
  useGeju,
  shishenWuxing,
  type GejuQuality,
  type GejuCategory,
  type GejuOutput,
  skillNames,
} from '@/lib'
import { useGejuExtras } from '@/lib/geju/hooks'
import { useBaziStore, type ExtraPillar } from '@@/stores'
import { SkillLink } from '@@/SkillLink'

// 配色 (按"是否引化"区分颜色饱和度, 边框样式不变):
//   已引化 吉   border-emerald-500 + bg-emerald-500/10
//   已引化 凶   border-rose-500    + bg-rose-500/10
//   已引化 中   border-slate-400   + bg-slate-400/10
//   未引化      同色 30 透明 + 同色 5 底色 (仅岁运潜在格)
//   岁运破格    border-red-500     + bg-red-500/15 (覆盖以上)
//
// 引化判定 (新结构 GejuHit.岁运 + GejuHit.显隐):
//   显隐 = '显' → 已引化 (原局成格 / 岁运 DefaultTrigger / 岁运 Trigger)。
//   显隐 = '隐' → 仅潜在 (isSuiyun 而无 DefaultTrigger / Trigger 撑起), 同色淡显。
//   岁运.Break / 岁运.Conquer 直接覆盖为破格红, 不论显隐。
const FORMED_BORDER: Record<GejuQuality, string> = {
  good: 'border-emerald-500 bg-emerald-500/10 [--glow-color:#10b981]',
  bad: 'border-rose-500 bg-rose-500/10 [--glow-color:#f43f5e]',
  neutral: 'border-slate-400 bg-slate-400/10 [--glow-color:#94a3b8]',
}
const UNFORMED_BORDER: Record<GejuQuality, string> = {
  good: 'border-emerald-500/30 bg-emerald-500/5 [--glow-color:#10b981]',
  bad: 'border-rose-500/30 bg-rose-500/5 [--glow-color:#f43f5e]',
  neutral: 'border-slate-400/30 bg-slate-400/5 [--glow-color:#94a3b8]',
}

/** 岁运格是否已被引化激活 (默认 undefined = 显)。 */
function isFormed(h: GejuOutput): boolean {
  return (h.显隐 ?? '显') === '显'
}

function hitBorderClass(h: GejuOutput): string {
  if (h.岁运?.Break || h.岁运?.Conquer)
    return 'border-red-500 bg-red-500/15 [--glow-color:#ef4444]'
  return (isFormed(h) ? FORMED_BORDER : UNFORMED_BORDER)[h.quality]
}

function GejuChip({ hit }: { hit: GejuOutput }) {
  const display = hit.guigeVariant ?? hit.name
  return (
    <SkillLink
      category="geju"
      name={hit.name}
      subtitle={hit.note}
      className={`text-sm px-3 py-1 rounded-full border-2 ${hitBorderClass(hit)} ${CATEGORY_TEXT[hit.category]}`}
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

export function GejuPanel() {
  const pillars = useBazi((s) => s.pillars)
  const hits = useGeju((s) => s.hits)
  const extras = useBaziStore((s) => s.extraPillars)
  const dayGan = pillars[2]?.gan as Gan | undefined

  const activeDaYun = extras.find((e) => e.label === '大运') ?? null
  const activeLiuNian = extras.find((e) => e.label === '流年') ?? null

  // 把 UI 选中的岁运 同步到 useGejuExtras → 触发 useGeju 重算
  useEffect(() => {
    if (!dayGan) {
      useGejuExtras.getState().clearExtras()
      return
    }
    useGejuExtras.getState().setExtras({
      dayun: activeDaYun ? extraToPillar(activeDaYun, dayGan) : null,
      liunian: activeLiuNian ? extraToPillar(activeLiuNian, dayGan) : null,
    })
  }, [dayGan, activeDaYun, activeLiuNian])

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
        // 原局段 = 非岁运特定
        const activeHits = hits.filter((h) => !h.岁运?.isSuiyun)
        // 岁运有变段 = 全部岁运特定（无论是否默认成格/已激发）
        const suiyunHits = hits.filter((h) => h.岁运?.isSuiyun)
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

      <div className="mt-3 text-[10px] text-slate-400 dark:text-slate-600 text-right leading-relaxed">
        算法版本 v5 · 原局成格 = 已引化 (深色); 岁运段需 默认成格 / 大运 / 流年 引化 才显深色, 否则淡色表"潜在可能"。
      </div>
    </section>
  )
}
