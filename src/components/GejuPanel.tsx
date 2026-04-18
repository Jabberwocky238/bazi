import { useState } from 'react'
import type { Pillar } from '@/lib/store'
import { detectGeju } from '@/lib/geju'
import { SkillLink } from '@@/SkillLink'

const ALL_GEJU = [
  '建禄格', '魁罡格', '壬骑龙背',
  '官印相生', '杀印相生', '官杀混杂',
  '食神制杀', '食伤泄秀', '食伤混杂', '枭神夺食',
  '伤官生财', '伤官佩印', '伤官见官', '伤官合杀',
  '羊刃驾杀', '羊刃劫财',
  '财官印全', '财多身弱', '以财破印', '比劫重重',
  '禄马同乡',
  '专旺格', '曲直格', '炎上格', '稼穑格', '从革格', '润下格',
  '从财格', '从杀格', '弃命从势',
  '木火通明', '水木清华', '水火既济', '水火相战',
  '金寒水冷', '金火铸印', '火旺金衰',
  '土金毓秀', '土重金埋',
  '寒木向阳', '木多火塞', '木疏厚土', '斧斤伐木',
  '日照江河',
]

export function GejuPanel({ pillars }: { pillars: Pillar[] }) {
  const hits = detectGeju(pillars)
  const hitSet = new Set(hits.map((h) => h.name))
  const others = ALL_GEJU.filter((n) => !hitSet.has(n))
  const [showAll, setShowAll] = useState(false)

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm">
      <div className="flex items-baseline justify-between mb-3 gap-3">
        <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
          格局分析
        </h2>
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          自动识别 · 仅供参考
        </span>
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
              className="text-sm px-3 py-1 rounded-full border border-amber-600/40 bg-amber-600/10 text-amber-700 dark:text-amber-400"
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
                className="text-xs px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400"
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
