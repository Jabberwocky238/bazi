import { useState } from 'react'
import { ganWuxing, wuxingRelations, isYangGan, type Gan } from '@jabberwocky238/bazi-engine'
import { WUXING_TEXT, WUXING_BG_SOFT, WUXING_BORDER } from '@/lib'
import { useShiShen } from '@@/stores'
import { SkillLink } from '@@/SkillLink'

type RelationKey = '同类' | '我生' | '我克' | '克我' | '生我'

interface Row {
  relation: RelationKey
  category: string
  /** [same-yinyang shishen, different-yinyang shishen] */
  shishens: [string, string]
}

const ROWS: Row[] = [
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

export function DayMasterRelations() {
  const pillars = useShiShen((s) => s.result.pillars)
  const [open, setOpen] = useState(true)
  const dayGan = pillars[2]?.gan as Gan | undefined
  if (!dayGan) return null

  const rel = wuxingRelations(dayGan)
  const dayWx = ganWuxing(dayGan)
  const dayYang = isYangGan(dayGan)
  const yinYang = dayYang ? '阳' : '阴'

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
            五行关系
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-slate-600">
            {open ? '点击收起' : '点击展开'}
          </span>
        </span>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs">日主</span>
          <span
            className={[
              'inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-lg border',
              WUXING_TEXT[dayWx], WUXING_BG_SOFT[dayWx], WUXING_BORDER[dayWx],
            ].join(' ')}
          >
            {dayGan}
          </span>
          <span className={`text-sm font-medium ${WUXING_TEXT[dayWx]}`}>
            {yinYang}{dayWx} · {dayGan}{dayWx}
          </span>
        </div>
      </button>

      {open && (
      <div className="space-y-1">
        {ROWS.map((row) => {
          const target = rel[row.relation]
          const tText = WUXING_TEXT[target] ?? ''
          const pair = WUXING_TO_GANS[target]
          const sameGan = pair ? (dayYang ? pair.yang : pair.yin) : ''
          const diffGan = pair ? (dayYang ? pair.yin : pair.yang) : ''

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
              <span className={`w-9 md:w-10 text-sm font-medium shrink-0 ${tText}`}>
                {row.category}
              </span>

              <div className="flex-1 min-w-0 flex flex-wrap justify-end items-center gap-x-2 md:gap-x-3 gap-y-1">
                <GanShishen gan={sameGan} shishen={row.shishens[0]} wuxing={target} />
                <GanShishen gan={diffGan} shishen={row.shishens[1]} wuxing={target} />
              </div>
            </div>
          )
        })}
      </div>
      )}
    </section>
  )
}

function GanShishen({ gan, shishen, wuxing }: { gan: string; shishen: string; wuxing: string }) {
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
