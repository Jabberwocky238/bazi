import { useState } from 'react'
import { analyzeXiyong, type Cat, type GanZhiType, type WuXing, WUXING_TEXT, WUXING_BG_SOFT, WUXING_BORDER } from '@/lib'
import { useShiShen } from '@@/stores'
import { SkillLink } from '@@/SkillLink'

const CAT_TO_SHISHENS: Record<Cat, [string, string]> = {
  比劫: ['比肩', '劫财'],
  印:   ['正印', '偏印'],
  食伤: ['食神', '伤官'],
  财:   ['正财', '偏财'],
  官杀: ['正官', '七杀'],
}

const TONE: Record<'用神' | '喜神' | '忌神' | '调候', string> = {
  用神: 'border-amber-500/50 bg-amber-500/10',
  喜神: 'border-emerald-500/40 bg-emerald-500/10',
  忌神: 'border-rose-500/40 bg-rose-500/10',
  调候: 'border-sky-500/40 bg-sky-500/10',
}

const GANZHI_TONE: Record<GanZhiType, string> = {
  盖头: 'border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-400',
  截脚: 'border-rose-500/40 bg-rose-500/5 text-rose-700 dark:text-rose-400',
  '覆载(同气)': 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  '覆载(得载)': 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  '覆载(得覆)': 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400',
  中性: 'border-slate-300 dark:border-slate-700 text-slate-500',
}

const SECTION_LABEL = 'text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 uppercase'

export function XiyongPanel() {
  const pillars = useShiShen((s) => s.result.pillars)
  const [open, setOpen] = useState(true)
  const a = analyzeXiyong(pillars)
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
            喜用神分析
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-slate-600">
            {open ? '点击收起' : '点击展开'}
          </span>
        </span>
        <div className="flex items-baseline gap-2 text-sm">
          <span className={`font-medium ${WUXING_TEXT[a.dayWx]}`}>{a.dayGan} · {a.dayWx}</span>
          <span className="text-slate-500">{a.level}</span>
          {a.primaryWx && <span className="text-slate-400">/ 用 {a.primaryWx}</span>}
        </div>
      </button>

      {open && (
        <div className="space-y-5 text-sm">
          {/* 从格覆写（最前） */}
          {a.congOverride && (
            <div className="rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-800 dark:text-purple-300 px-3 py-2 text-xs leading-relaxed">
              ⚠ {a.congOverride}
            </div>
          )}

          {/* ① 干支关系 */}
          <div className="space-y-1.5">
            <div className={SECTION_LABEL}>① 干支关系 · 盖头 / 截脚 / 覆载</div>
            <div className="grid grid-cols-4 gap-1.5">
              {a.ganZhi.map((g) => (
                <div
                  key={g.pos}
                  className={`rounded border px-2 py-1.5 text-center ${GANZHI_TONE[g.type]}`}
                >
                  <div className="text-[10px] opacity-70">{g.pos}柱</div>
                  <div className="font-bold text-sm leading-tight">
                    <span className={WUXING_TEXT[g.ganWx] ?? ''}>{g.gan}</span>
                    <span className={WUXING_TEXT[g.zhiWx] ?? ''}>{g.zhi}</span>
                  </div>
                  <div className="text-[10px] font-medium">{g.type}</div>
                </div>
              ))}
            </div>
            {a.ganZhi.some((g) => g.type !== '中性' && g.note) && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {a.ganZhi.filter((g) => g.type !== '中性' && g.note).map((g) => (
                  <div key={g.pos}>{g.pos}柱 · {g.note}</div>
                ))}
              </div>
            )}
          </div>

          {/* ② 扶抑分析 */}
          <div className="space-y-1.5">
            <div className={SECTION_LABEL}>② 扶抑分析 · 日主 {a.level}</div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-950/40 px-3 py-2 text-xs leading-relaxed space-y-1">
              <div>
                <span className="text-slate-500">病根 · </span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {a.sickNote}
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">{a.reason}</div>
            </div>
          </div>

          {/* ③ 救应分析 */}
          <div className="space-y-1.5">
            <div className={SECTION_LABEL}>③ 救应分析 · 病有多重，救有多深</div>
            <div
              className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                a.jiuying.method
                  ? a.jiuying.medicinePresent
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-amber-500/40 bg-amber-500/5'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-slate-600 dark:text-slate-400">病象 · </span>
                <span className="font-medium">{a.jiuying.sickDesc}</span>
                {a.jiuying.method && (
                  <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-current/40">
                    方式 · {a.jiuying.method}
                  </span>
                )}
              </div>
              {a.jiuying.method && (
                <>
                  <div className="text-slate-600 dark:text-slate-400">{a.jiuying.reason}</div>
                  {a.jiuying.medicineWx && (
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-slate-500 text-[10px]">药</span>
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full border font-bold text-xs ${WUXING_TEXT[a.jiuying.medicineWx]} ${WUXING_BG_SOFT[a.jiuying.medicineWx]} ${WUXING_BORDER[a.jiuying.medicineWx]}`}
                      >
                        {a.jiuying.medicineWx}
                      </span>
                      <span className={a.jiuying.medicinePresent ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                        {a.jiuying.medicinePresent ? '✓ 有药' : '⚠ 待运'}
                      </span>
                      <span className="text-slate-500 text-[10px] flex-1">{a.jiuying.medicineNote}</span>
                    </div>
                  )}
                </>
              )}
              {!a.jiuying.method && (
                <div className="text-slate-500">{a.jiuying.reason}</div>
              )}
            </div>
          </div>

          {/* ④ 调候分析 */}
          <div className="space-y-1.5">
            <div className={SECTION_LABEL}>④ 调候分析 · 寒暖燥湿</div>
            <div className={`rounded-lg border px-3 py-2 text-xs ${a.tiaohou.required ? TONE.调候 : 'border-slate-200 dark:border-slate-700'}`}>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-slate-600 dark:text-slate-400">
                  月令 {a.monthZhi}
                </span>
                {a.tiaohou.required && a.tiaohou.wx ? (
                  <>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">硬约束</span>
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-xs border ${WUXING_TEXT[a.tiaohou.wx]} ${WUXING_BG_SOFT[a.tiaohou.wx]} ${WUXING_BORDER[a.tiaohou.wx]}`}
                    >
                      {a.tiaohou.wx}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-500">非硬约束</span>
                )}
              </div>
              <div className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {a.tiaohou.note}
                {a.tiaohou.required && (
                  <> · md 明文 <b className="text-slate-700 dark:text-slate-300">扶抑为主，调候服从</b>，至寒至暖月份仍须过问</>
                )}
              </div>
            </div>
          </div>

          {/* ⑤ 通关分析 */}
          <div className="space-y-1.5">
            <div className={SECTION_LABEL}>⑤ 通关分析 · 两强相战</div>
            <div
              className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                a.tongguan.active
                  ? a.tongguan.bridgePresent
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-rose-500/40 bg-rose-500/5'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              {a.tongguan.active && a.tongguan.a && a.tongguan.b && a.tongguan.bridgeWx ? (
                <>
                  <div className="flex items-center gap-1 mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-xs border ${WUXING_TEXT[a.tongguan.a]} ${WUXING_BG_SOFT[a.tongguan.a]} ${WUXING_BORDER[a.tongguan.a]}`}
                    >{a.tongguan.a}</span>
                    <span className="text-slate-500 mx-1">↔</span>
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-xs border ${WUXING_TEXT[a.tongguan.b]} ${WUXING_BG_SOFT[a.tongguan.b]} ${WUXING_BORDER[a.tongguan.b]}`}
                    >{a.tongguan.b}</span>
                    <span className="text-slate-500 mx-2">需桥梁</span>
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-xs border ${WUXING_TEXT[a.tongguan.bridgeWx]} ${WUXING_BG_SOFT[a.tongguan.bridgeWx]} ${WUXING_BORDER[a.tongguan.bridgeWx]}`}
                    >{a.tongguan.bridgeWx}</span>
                    <span className={`ml-auto text-[10px] ${a.tongguan.bridgePresent ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {a.tongguan.bridgePresent ? '✓ 有桥' : '✗ 无桥'}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">{a.tongguan.note}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">{a.tongguan.bridgeNote}</div>
                </>
              ) : (
                <div className="text-slate-500">{a.tongguan.note}</div>
              )}
            </div>
          </div>

          {/* ⑥ 喜忌 */}
          <div className="space-y-2">
            <div className={SECTION_LABEL}>⑥ 喜忌 · 用神 / 喜神 / 忌神</div>
            {a.primaryCat && a.primaryWx && (
              <GodRow label="用神" cat={a.primaryCat} wx={a.primaryWx} toneCls={TONE.用神} />
            )}
            {a.secondaryCat && a.secondaryWx && (
              <GodRow label="喜神" cat={a.secondaryCat} wx={a.secondaryWx} toneCls={TONE.喜神} />
            )}
            {a.avoidCats.length > 0 && (
              <div>
                <div className="text-[11px] tracking-wider font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                  忌神
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {a.avoidCats.map((c, i) => (
                    <CatChip key={c} cat={c} wx={a.avoidWx[i]} toneCls={TONE.忌神} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 来源 */}
          <div className="text-[10px] text-slate-400 dark:text-slate-600 text-right leading-5 pt-2 border-t border-slate-100 dark:border-slate-800">
            依
            <SkillLink category="jichu" name="喜用神" className="mx-1 underline">喜用神</SkillLink>
            /
            <SkillLink category="jichu" name="扶抑" className="mx-1 underline">扶抑</SkillLink>
            /
            <SkillLink category="jichu" name="救应" className="mx-1 underline">救应</SkillLink>
            /
            <SkillLink category="jichu" name="寒暖燥湿" className="mx-1 underline">寒暖燥湿</SkillLink>
            /
            <SkillLink category="jichu" name="通关" className="mx-1 underline">通关</SkillLink>
            /
            <SkillLink category="jichu" name="盖头" className="mx-1 underline">盖头</SkillLink>
            /
            <SkillLink category="jichu" name="截脚" className="mx-1 underline">截脚</SkillLink>
            /
            <SkillLink category="jichu" name="覆载" className="mx-1 underline">覆载</SkillLink>
            <br />
            md 明文"扶抑为主 · 调候为辅 · 从格出现一切推翻"，合冲刑害需人工再审
          </div>
        </div>
      )}
    </section>
  )
}

function GodRow({
  label, cat, wx, toneCls,
}: {
  label: string
  cat: Cat
  wx: WuXing
  toneCls: string
}) {
  return (
    <div>
      <div className="text-[11px] tracking-wider font-medium text-slate-500 dark:text-slate-400 mb-1.5">
        {label}
      </div>
      <CatChip cat={cat} wx={wx} toneCls={toneCls} />
    </div>
  )
}

function CatChip({ cat, wx, toneCls }: { cat: Cat; wx: WuXing; toneCls: string }) {
  const [a, b] = CAT_TO_SHISHENS[cat]
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border-2 ${toneCls}`}>
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full border font-bold text-xs ${WUXING_TEXT[wx]} ${WUXING_BG_SOFT[wx]} ${WUXING_BORDER[wx]}`}
      >
        {wx}
      </span>
      <span className={`font-medium ${WUXING_TEXT[wx]}`}>{cat}</span>
      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex gap-0.5 ml-1">
        <SkillLink category="shishen" name={a} className="underline decoration-dotted">{a}</SkillLink>
        <SkillLink category="shishen" name={b} className="underline decoration-dotted">{b}</SkillLink>
      </span>
    </span>
  )
}
