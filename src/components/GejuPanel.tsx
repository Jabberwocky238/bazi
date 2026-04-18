import { useState } from 'react'
import type { Pillar } from '@/lib/store'
import { detectGeju } from '@/lib/geju'
import { SkillLink } from '@@/SkillLink'

type GejuCategory = 'shishen' | 'wuxing' | 'zhuanwang' | 'special'

const GEJU_CATEGORY: Record<string, GejuCategory> = {
  // 十神格
  建禄格: 'shishen',
  魁罡格: 'shishen',
  官杀混杂: 'shishen',
  官印相生: 'shishen',
  杀印相生: 'shishen',
  食神制杀: 'shishen',
  枭神夺食: 'shishen',
  伤官见官: 'shishen',
  伤官合杀: 'shishen',
  伤官生财: 'shishen',
  伤官佩印: 'shishen',
  食伤混杂: 'shishen',
  食伤泄秀: 'shishen',
  比劫重重: 'shishen',
  以财破印: 'shishen',
  财多身弱: 'shishen',
  // 五行象法
  水火既济: 'wuxing',
  水火相战: 'wuxing',
  木火通明: 'wuxing',
  木多火塞: 'wuxing',
  土金毓秀: 'wuxing',
  土重金埋: 'wuxing',
  金火铸印: 'wuxing',
  火旺金衰: 'wuxing',
  水木清华: 'wuxing',
  金寒水冷: 'wuxing',
  木疏厚土: 'wuxing',
  斧斤伐木: 'wuxing',
  // 专旺 / 从格
  曲直格: 'zhuanwang',
  炎上格: 'zhuanwang',
  稼穑格: 'zhuanwang',
  从革格: 'zhuanwang',
  润下格: 'zhuanwang',
  专旺格: 'zhuanwang',
  从财格: 'zhuanwang',
  从杀格: 'zhuanwang',
  弃命从势: 'zhuanwang',
  // 特殊格局
  壬骑龙背: 'special',
  羊刃驾杀: 'special',
  羊刃劫财: 'special',
  禄马同乡: 'special',
  财官印全: 'special',
  寒木向阳: 'special',
  日照江河: 'special',
}

const CHIP_BY_CAT: Record<GejuCategory, string> = {
  // 十神 = 琥珀金
  shishen:
    'border-amber-600/40 bg-amber-600/10 text-amber-700 dark:border-amber-400/40 dark:text-amber-400',
  // 五行 = 银白
  wuxing:
    'border-slate-400/50 bg-slate-300/20 text-slate-700 dark:border-slate-300/40 dark:bg-slate-400/15 dark:text-slate-200',
  // 专旺 = 绿
  zhuanwang:
    'border-emerald-600/40 bg-emerald-600/10 text-emerald-700 dark:border-emerald-400/40 dark:text-emerald-400',
  // 特殊 = 紫
  special:
    'border-purple-600/40 bg-purple-600/10 text-purple-700 dark:border-purple-400/40 dark:text-purple-400',
}

const CHIP_MUTED_BY_CAT: Record<GejuCategory, string> = {
  shishen: 'border-amber-700/25 text-amber-700/70 dark:text-amber-400/70',
  wuxing: 'border-slate-400/30 text-slate-600/70 dark:text-slate-400/70',
  zhuanwang: 'border-emerald-600/25 text-emerald-700/70 dark:text-emerald-400/70',
  special: 'border-purple-600/25 text-purple-700/70 dark:text-purple-400/70',
}

function categoryOf(name: string): GejuCategory {
  return GEJU_CATEGORY[name] ?? 'shishen'
}

const ALL_GEJU = Object.keys(GEJU_CATEGORY)

export function GejuPanel({ pillars }: { pillars: Pillar[] }) {
  const hits = detectGeju(pillars)
  const hitSet = new Set(hits.map((h) => h.name))
  const others = ALL_GEJU.filter((n) => !hitSet.has(n))
  const [showAll, setShowAll] = useState(false)

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
        <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
          格局分析
        </h2>
        <div className="text-[11px] text-slate-400 dark:text-slate-500 flex gap-3 flex-wrap">
          <span className="text-amber-700 dark:text-amber-400">● 十神</span>
          <span className="text-slate-500 dark:text-slate-300">● 五行</span>
          <span className="text-emerald-700 dark:text-emerald-400">● 专旺</span>
          <span className="text-purple-700 dark:text-purple-400">● 特殊</span>
        </div>
      </div>

      {hits.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          未识别到明显格局
        </p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-2">
          {hits.map((h) => (
            <SkillLink
              key={h.name}
              category="geju"
              name={h.name}
              subtitle={h.note}
              className={`text-sm px-3 py-1 rounded-full border ${CHIP_BY_CAT[categoryOf(h.name)]}`}
            >
              {h.name}
            </SkillLink>
          ))}
        </div>
      )}

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
                className={`text-xs px-2.5 py-0.5 rounded-full border ${CHIP_MUTED_BY_CAT[categoryOf(n)]}`}
              >
                {n}
              </SkillLink>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
