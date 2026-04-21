import { useState } from 'react'
import { type Pillar, WUXING_TEXT, WUXING_BG_SOFT, WUXING_BORDER } from '@/lib'
import { useShiShen } from '@@/stores'
import { SkillLink } from '@@/SkillLink'
import { ganWuxing, wuxingRelations, isYangGan, type Gan } from '@jabberwocky238/bazi-engine'

type Cat = '比劫' | '印' | '食伤' | '财' | '官杀'

const CAT_TO_SHISHENS: Record<Cat, [string, string]> = {
  比劫: ['比肩', '劫财'],
  印: ['正印', '偏印'],
  食伤: ['食神', '伤官'],
  财: ['正财', '偏财'],
  官杀: ['正官', '七杀'],
}

const CAT_TO_REL: Record<Cat, '同类' | '生我' | '我生' | '我克' | '克我'> = {
  比劫: '同类',
  印: '生我',
  食伤: '我生',
  财: '我克',
  官杀: '克我',
}

const CAT_TO_ZOUZUO: Record<Cat, string> = {
  比劫: '同我 · 帮身',
  印: '生我 · 护身',
  食伤: '我生 · 泄秀',
  财: '我克 · 耗身',
  官杀: '克我 · 制身',
}

const SHISHEN_TO_CAT: Record<string, Cat> = {
  比肩: '比劫', 劫财: '比劫',
  正印: '印', 偏印: '印',
  食神: '食伤', 伤官: '食伤',
  正财: '财', 偏财: '财',
  正官: '官杀', 七杀: '官杀',
}

const SEASON_BY_ZHI: Record<string, '春' | '夏' | '秋' | '冬'> = {
  寅: '春', 卯: '春', 辰: '春',
  巳: '夏', 午: '夏', 未: '夏',
  申: '秋', 酉: '秋', 戌: '秋',
  亥: '冬', 子: '冬', 丑: '冬',
}

interface CountsByCat {
  比劫: number
  印: number
  食伤: number
  财: number
  官杀: number
}

interface Analysis {
  dayGan: string
  dayWx: string
  level: '身极弱' | '身弱' | '身偏弱' | '身中和' | '身偏旺' | '身旺' | '身极旺'
  deLing: boolean
  deDi: boolean
  deShi: boolean
  selfSupportN: number
  counts: CountsByCat
  primary: Cat[]      // 主用神候选 (最需要的)
  favor: Cat[]        // 喜神 (辅助)
  avoid: Cat[]        // 忌神
  tiaohou: string | null   // 调候建议
}

function analyze(pillars: Pillar[]): Analysis | null {
  if (pillars.length !== 4 || !pillars[2]?.gan) return null
  const dayGan = pillars[2].gan
  const dayWx = ganWuxing(dayGan)
  const monthZhi = pillars[1]?.zhi
  const season = SEASON_BY_ZHI[monthZhi] ?? ''

  // 比劫 + 印 支持位统计
  const counts: CountsByCat = { 比劫: 0, 印: 0, 食伤: 0, 财: 0, 官杀: 0 }
  const ganSs = [pillars[0].shishen, pillars[1].shishen, pillars[3].shishen].filter(
    (s) => s && s !== '日主',
  )
  const allHide = pillars.flatMap((p) => p.hideShishen)

  for (const s of ganSs) {
    const c = SHISHEN_TO_CAT[s]
    if (c) counts[c] += 1
  }
  for (const s of allHide) {
    const c = SHISHEN_TO_CAT[s]
    if (c) counts[c] += 1
  }

  // 得令/得地/得势
  const mainMonth = pillars[1].hideShishen[0] ?? ''
  const mainDay = pillars[2].hideShishen[0] ?? ''
  const deLing = ['比劫', '印'].includes(SHISHEN_TO_CAT[mainMonth])
  const deDi = ['比劫', '印'].includes(SHISHEN_TO_CAT[mainDay])
  const selfSupportN = counts.比劫 + counts.印
  const deShi = selfSupportN >= 4

  // 强弱分级
  let level: Analysis['level']
  if (selfSupportN === 0) level = '身极弱'
  else if (selfSupportN >= 8) level = '身极旺'
  else {
    const numDe = [deLing, deDi, deShi].filter(Boolean).length
    if (numDe === 3) level = '身旺'
    else if (numDe === 2) level = '身偏旺'
    else if (numDe === 1) level = '身偏弱'
    else if (selfSupportN >= 2) level = '身中和'
    else level = '身弱'
  }

  // 喜用神
  let primary: Cat[] = []
  let favor: Cat[] = []
  let avoid: Cat[] = []
  if (level === '身极弱') {
    // 从弱：顺最旺之神
    const other = (['官杀', '财', '食伤'] as Cat[]).sort((a, b) => counts[b] - counts[a])[0]
    primary = [other]
    favor = ['财', '官杀', '食伤'].filter((c) => c !== other) as Cat[]
    avoid = ['印', '比劫']
  } else if (level === '身极旺') {
    // 专旺：顺势用同党
    primary = ['比劫', '印']
    favor = []
    avoid = ['官杀', '财']
  } else if (level === '身旺' || level === '身偏旺') {
    // 身旺：泄克为宜
    primary = counts.食伤 > 0 || counts.财 > 0 ? ['食伤', '财'] : ['官杀']
    favor = ['财', '官杀', '食伤'].filter((c) => !primary.includes(c as Cat)) as Cat[]
    avoid = ['比劫', '印']
  } else if (level === '身弱' || level === '身偏弱') {
    // 身弱：生扶为宜
    primary = counts.印 > 0 ? ['印', '比劫'] : ['比劫', '印']
    favor = []
    avoid = ['官杀', '财', '食伤']
  } else {
    // 身中和：看最弱哪方，适中用
    primary = ['食伤']
    favor = ['财']
    avoid = []
  }

  // 调候
  let tiaohou: string | null = null
  if (season === '冬' && dayWx !== '火') tiaohou = '冬寒局，宜见火暖局'
  else if (season === '夏' && dayWx !== '水') tiaohou = '夏燥局，宜见水润局'
  else if (season === '秋' && dayWx === '金') tiaohou = '秋金白，宜水泄秀或火暖'
  else if (season === '春' && dayWx === '木') tiaohou = '春木茂，宜火吐秀或金修'

  return {
    dayGan, dayWx, level,
    deLing, deDi, deShi, selfSupportN,
    counts, primary, favor, avoid, tiaohou,
  }
}

function levelColor(level: Analysis['level']): string {
  if (level === '身极旺' || level === '身旺') return 'text-rose-600 dark:text-rose-400'
  if (level === '身偏旺') return 'text-amber-700 dark:text-amber-400'
  if (level === '身中和') return 'text-emerald-600 dark:text-emerald-400'
  if (level === '身偏弱') return 'text-sky-600 dark:text-sky-400'
  return 'text-indigo-600 dark:text-indigo-400'
}

export function BalancePanel() {
  const pillars = useShiShen((s) => s.result.pillars)
  const [open, setOpen] = useState(true)
  const a = analyze(pillars)
  if (!a) return null

  const rel = wuxingRelations(a.dayGan as Gan)
  const dayYang = isYangGan(a.dayGan as Gan)

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
            身强身弱 · 喜用神
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-slate-600">
            {open ? '点击收起' : '点击展开'}
          </span>
        </span>
        <span className={`text-sm font-medium ${levelColor(a.level)}`}>{a.level}</span>
      </button>

      {open && (
        <div className="space-y-3 text-sm">
          {/* 三得判据 */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
            <span>得令 <b className={a.deLing ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>{a.deLing ? '✓' : '✗'}</b></span>
            <span>得地 <b className={a.deDi ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>{a.deDi ? '✓' : '✗'}</b></span>
            <span>得势 <b className={a.deShi ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>{a.deShi ? '✓' : '✗'}</b></span>
            <span>比劫+印 {a.selfSupportN} 位</span>
          </div>

          {/* 喜用神 */}
          <GodRow label="用神" cats={a.primary} tone="primary" dayGan={a.dayGan} rel={rel} dayYang={dayYang} />
          {a.favor.length > 0 && (
            <GodRow label="喜神" cats={a.favor} tone="favor" dayGan={a.dayGan} rel={rel} dayYang={dayYang} />
          )}
          {a.avoid.length > 0 && (
            <GodRow label="忌神" cats={a.avoid} tone="avoid" dayGan={a.dayGan} rel={rel} dayYang={dayYang} />
          )}

          {/* 调候 */}
          {a.tiaohou && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="mr-2 text-slate-700 dark:text-slate-200 font-medium">调候</span>
              {a.tiaohou}
              <span className="ml-2">
                <SkillLink category="jichu" name="调候" className="text-amber-700 dark:text-amber-400 underline">
                  释义
                </SkillLink>
              </span>
            </div>
          )}

          <div className="text-[10px] text-slate-400 dark:text-slate-600 text-right pt-1">
            算法基于三得 (令/地/势) + 比劫印总位数，仅供参考
          </div>
        </div>
      )}
    </section>
  )
}

interface GodRowProps {
  label: string
  cats: Cat[]
  tone: 'primary' | 'favor' | 'avoid'
  dayGan: string
  rel: Record<string, string>
  dayYang: boolean
}

const TONE_CLASS: Record<'primary' | 'favor' | 'avoid', string> = {
  primary: 'bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-400',
  favor: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
  avoid: 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-400',
}

function GodRow({ label, cats, tone, rel }: GodRowProps) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-10 shrink-0 text-[11px] tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {cats.map((c) => {
          const wx = rel[CAT_TO_REL[c]] ?? ''
          const wxText = WUXING_TEXT[wx] ?? ''
          return (
            <span key={c} className={`inline-flex items-center gap-1.5 text-sm px-2.5 py-0.5 rounded-full border-2 ${TONE_CLASS[tone]}`}>
              <span
                className={[
                  'w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold',
                  wxText,
                  WUXING_BG_SOFT[wx] ?? '',
                  WUXING_BORDER[wx] ?? '',
                ].join(' ')}
              >
                {wx}
              </span>
              <span className="font-medium">{c}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {CAT_TO_ZOUZUO[c]}
              </span>
              <span className="flex gap-0.5 text-[10px]">
                {CAT_TO_SHISHENS[c].map((ss) => (
                  <SkillLink key={ss} category="shishen" name={ss} className="text-slate-500 dark:text-slate-400 underline decoration-dotted">
                    {ss}
                  </SkillLink>
                ))}
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
