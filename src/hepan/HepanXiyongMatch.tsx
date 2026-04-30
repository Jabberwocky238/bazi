import { useMemo, useState } from 'react'
import {
  type Pillar,
  analyzeSide,
  computeXiyongMatch,
  scoreMatch,
  wxDistribution,
  wxSupply,
  type SideAnalysis,
} from '@/lib'
import {
  WUXING_TEXT, WUXING_BG_SOFT, WUXING_BORDER,
  XIYONG_TONE, GANZHI_TONE, STRENGTH_LEVEL_COLOR,
} from '@@/css'

interface Props {
  a: Pillar[]
  b: Pillar[]
  aName: string
  bName: string
}

export function HepanXiyongMatch({ a, b, aName, bName }: Props) {
  const [open, setOpen] = useState(true)

  const aSide = useMemo(() => analyzeSide(a), [a])
  const bSide = useMemo(() => analyzeSide(b), [b])
  const match = useMemo(
    () => computeXiyongMatch(
      a, aSide?.xiyong ?? null, aName,
      b, bSide?.xiyong ?? null, bName,
    ),
    [a, aSide, aName, b, bSide, bName],
  )
  const score = useMemo(() => scoreMatch(match), [match])
  const aDist = useMemo(() => wxDistribution(a), [a])
  const bDist = useMemo(() => wxDistribution(b), [b])

  if (!aSide || !bSide) return null

  const colorOf = (s: number) => s >= 70
    ? 'text-emerald-600 dark:text-emerald-400'
    : s >= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400'

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 md:p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 flex-wrap text-left ${open ? 'mb-4' : ''}`}
      >
        <span className="flex items-baseline gap-2">
          <span className={`text-[11px] inline-block transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
          <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
            喜用神 · 双方分析 · {aName} ↔ {bName}
          </h2>
        </span>
        <span className="flex items-baseline gap-1 text-lg font-bold tabular-nums">
          <span title={`${bName} 对 ${aName} 喜用程度`} className={colorOf(score.a)}>{score.a}</span>
          <span className="text-slate-400 text-sm">/</span>
          <span title={`${aName} 对 ${bName} 喜用程度`} className={colorOf(score.b)}>{score.b}</span>
        </span>
      </button>

      {open && (
        <div className="space-y-6 text-sm">
          {/* 身强弱 + 用神 总览 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SideHead name={aName} side={aSide} />
            <SideHead name={bName} side={bSide} />
          </div>

          <Detail label="病根 / 扶抑">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SickCard name={aName} side={aSide} />
              <SickCard name={bName} side={bSide} />
            </div>
          </Detail>

          {(() => {
            // 跨盘"药"判定 — 不假定互为, 各方向独立检查 (可能仅单向, 也可能双向, 也可能都不成立).
            const aRow = renderCrossMedicine(aName, aSide, bName, b)
            const bRow = renderCrossMedicine(bName, bSide, aName, a)
            if (!aRow && !bRow) return null
            return (
              <Detail label="救应">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aRow}
                  {bRow}
                </div>
              </Detail>
            )
          })()}

          {(() => {
            // —— 调候段: 先列谁需要调候 (本身需求, 不关心对方); 再列跨盘谁调候谁 (有提供才显示).
            const aNeed = aSide.xiyong.tiaohou.required ? aSide : null
            const bNeed = bSide.xiyong.tiaohou.required ? bSide : null
            if (!aNeed && !bNeed) return null

            const aCross = renderCrossTiaohou(aName, aSide, bName, b)
            const bCross = renderCrossTiaohou(bName, bSide, aName, a)
            const hasCross = !!(aCross || bCross)

            return (
              <Detail label="调候">
                <div className="space-y-3">
                  {/* ① 谁需要调候 */}
                  <div>
                    <div className="text-[10px] tracking-wider font-medium text-slate-400 dark:text-slate-500 mb-1.5">
                      ① 需要调候
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aNeed && <TiaohouNeedCard name={aName} side={aNeed} />}
                      {bNeed && <TiaohouNeedCard name={bName} side={bNeed} />}
                    </div>
                  </div>
                  {/* ② 跨盘是否能调候 — 任一方向成立才显示, 整段无则隐藏 */}
                  {hasCross && (
                    <div>
                      <div className="text-[10px] tracking-wider font-medium text-slate-400 dark:text-slate-500 mb-1.5">
                        ② 跨盘调候
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aCross}
                        {bCross}
                      </div>
                    </div>
                  )}
                </div>
              </Detail>
            )
          })()}

          {(aSide.xiyong.tongguan.active || bSide.xiyong.tongguan.active) && (
            <Detail label="通关 (两强相战)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TongguanCard name={aName} side={aSide} />
                <TongguanCard name={bName} side={bSide} />
              </div>
            </Detail>
          )}

          <Detail label="干支作用 · 盖头 / 截脚 / 覆载">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <GanZhiCard name={aName} side={aSide} />
              <GanZhiCard name={bName} side={bSide} />
            </div>
          </Detail>

          <Detail label="① 互供用神">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <SupplyRow
                from={bName} to={aName}
                primaryWx={aSide.xiyong.primaryWx} primaryN={match.aPrimaryFromB}
                secondaryWx={aSide.xiyong.secondaryWx} secondaryN={match.aSecondaryFromB}
              />
              <SupplyRow
                from={aName} to={bName}
                primaryWx={bSide.xiyong.primaryWx} primaryN={match.bPrimaryFromA}
                secondaryWx={bSide.xiyong.secondaryWx} secondaryN={match.bSecondaryFromA}
              />
            </div>
          </Detail>

          {(aSide.xiyong.tiaohou.required || bSide.xiyong.tiaohou.required) && (
            <Detail label="② 调候补足 (互相)">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {aSide.xiyong.tiaohou.required && aSide.xiyong.tiaohou.wx && (
                  <TiaohouSupply from={bName} to={aName} wx={aSide.xiyong.tiaohou.wx} n={match.aTiaohouFromB} />
                )}
                {bSide.xiyong.tiaohou.required && bSide.xiyong.tiaohou.wx && (
                  <TiaohouSupply from={aName} to={bName} wx={bSide.xiyong.tiaohou.wx} n={match.bTiaohouFromA} />
                )}
              </div>
            </Detail>
          )}

          <Detail label="③ 忌神冲撞 (互相)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <AvoidRow from={bName} to={aName} avoidWx={aSide.xiyong.avoidWx} n={match.aAvoidFromB} />
              <AvoidRow from={aName} to={bName} avoidWx={bSide.xiyong.avoidWx} n={match.bAvoidFromA} />
            </div>
          </Detail>

          <Detail label="④ 双方五行分布">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DistRow name={aName} dist={aDist} />
              <DistRow name={bName} dist={bDist} />
            </div>
          </Detail>

          <p className="text-[10px] text-slate-400 dark:text-slate-600 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
            头部 <b>x/y</b>: x = {bName} 对 {aName} 喜用程度, y = {aName} 对 {bName} 喜用程度. 双方各自 0-100, 不互通.
            <br />
            单边公式 = 50 + 主用 ×12 + 喜神 ×6 + 调候 ×8 - 忌神 ×4
            {' '}+ 跨盘合 ×3 - 冲 ×4 - 刑害破 ×2 - 克 ×3 (跨盘项双方共享).
          </p>
        </div>
      )}
    </section>
  )
}

// ————————————————————————————————————————————————————————

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.2em] font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">
        {label}
      </div>
      {children}
    </div>
  )
}

function SideHead({ name, side }: { name: string; side: SideAnalysis }) {
  const xy = side.xiyong
  const str = side.strength
  const lvlColor = STRENGTH_LEVEL_COLOR[xy.level] ?? 'text-slate-500'
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-950/40 px-3 py-2 text-xs leading-relaxed">
      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-slate-500">{name}</span>
        <span
          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-sm border ${WUXING_TEXT[xy.dayWx]} ${WUXING_BG_SOFT[xy.dayWx]} ${WUXING_BORDER[xy.dayWx]}`}
        >{xy.dayGan}</span>
        <span className={`font-medium ${WUXING_TEXT[xy.dayWx]}`}>{xy.dayWx}</span>
        <span className={`font-medium ${lvlColor}`}>{xy.level}</span>
        <span className="text-slate-400 tabular-nums ml-auto">S = {str.score}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 mb-1.5 text-[10px]">
        <Stat label="得令" ok={str.deLing} />
        <Stat label="得地" ok={str.roots[2].kind !== 'none'} />
        <Stat label="得势" ok={str.ganPoints > 0} />
      </div>
      <div className="text-slate-600 dark:text-slate-400 space-y-0.5">
        {xy.primaryWx && (
          <div>
            <span className="opacity-70">用神</span>{' '}
            <CatBadge cat="用神">{xy.primaryCat}</CatBadge> <WxBadge wx={xy.primaryWx} />
            {xy.secondaryWx && (
              <>
                {'  '}<span className="opacity-70">喜神</span>{' '}
                <CatBadge cat="喜神">{xy.secondaryCat}</CatBadge> <WxBadge wx={xy.secondaryWx} />
              </>
            )}
          </div>
        )}
        {xy.avoidWx.length > 0 && (
          <div>
            <span className="opacity-70">忌神</span>{' '}
            {xy.avoidWx.map((w, i) => (
              <span key={i} className="inline-flex items-baseline gap-0.5 mr-1">
                <CatBadge cat="忌神">{xy.avoidCats[i]}</CatBadge> <WxBadge wx={w} />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center gap-0.5 px-1 py-0.5 rounded border ${
      ok ? 'border-emerald-400/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
         : 'border-slate-200 dark:border-slate-700 text-slate-400'
    }`}>
      {ok ? '✓' : '✗'} {label}
    </span>
  )
}

function SickCard({ name, side }: { name: string; side: SideAnalysis }) {
  const xy = side.xiyong
  return (
    <div className="rounded-lg bg-slate-50 dark:bg-slate-950/40 px-3 py-2 text-xs leading-relaxed">
      <div className="text-slate-500 mb-0.5">{name}</div>
      <div className="font-medium text-slate-700 dark:text-slate-200 mb-0.5">病根 · {xy.sickNote}</div>
      <div className="text-[11px] text-slate-600 dark:text-slate-400">{xy.reason}</div>
    </div>
  )
}

/**
 * 跨盘救应: 如果 self 有病象 + 药五行, 且 other 提供该药五行 ≥ 1 位,
 *  → 显示 "otherName 是 selfName 的药"; 否则返回 null (由调用方判定整段是否显示).
 */
function renderCrossMedicine(
  selfName: string, self: SideAnalysis,
  otherName: string, other: Pillar[],
): React.ReactNode | null {
  const j = self.xiyong.jiuying
  if (!j.method || !j.medicineWx) return null
  const supplyN = wxSupply(other, j.medicineWx)
  if (supplyN === 0) return null
  return (
    <div
      key={`${otherName}-药-${selfName}`}
      className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2 text-xs leading-relaxed"
    >
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {otherName} 是 {selfName} 的药
        </span>
        <WxBadge wx={j.medicineWx} />
        <span className="ml-auto text-[10px] tabular-nums text-emerald-700 dark:text-emerald-400">
          {supplyN} 位
        </span>
      </div>
      <div className="text-[11px] text-slate-600 dark:text-slate-400">
        病象 · {j.sickDesc} · {j.method}
      </div>
      <div className="text-[10px] opacity-70 mt-0.5">{j.reason}</div>
    </div>
  )
}

/** "本方需要调候" 卡 — 不关心对方是否提供, 只表本人调候硬约束. */
function TiaohouNeedCard({ name, side }: { name: string; side: SideAnalysis }) {
  const t = side.xiyong.tiaohou
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${XIYONG_TONE.调候}`}>
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-slate-500">{name}</span>
        <span className="font-medium text-rose-600 dark:text-rose-400">需要调候</span>
        {t.wx && <WxBadge wx={t.wx} />}
      </div>
      <div className="text-[11px] text-slate-600 dark:text-slate-400">{t.note}</div>
    </div>
  )
}

/**
 * 跨盘调候: 如果 self 调候硬约束 + 需要某五行, 且 other 提供该五行 ≥ 1 位,
 *  → 显示 "otherName 调候 selfName"; 否则返回 null (单方向检查, 不假设互为).
 */
function renderCrossTiaohou(
  selfName: string, self: SideAnalysis,
  otherName: string, other: Pillar[],
): React.ReactNode | null {
  const t = self.xiyong.tiaohou
  if (!t.required || !t.wx) return null
  const supplyN = wxSupply(other, t.wx)
  if (supplyN === 0) return null
  return (
    <div
      key={`${otherName}-调候-${selfName}`}
      className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${XIYONG_TONE.调候}`}
    >
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {otherName} 调候 {selfName}
        </span>
        <WxBadge wx={t.wx} />
        <span className="ml-auto text-[10px] tabular-nums text-emerald-700 dark:text-emerald-400">
          {supplyN} 位
        </span>
      </div>
      <div className="text-[11px] text-slate-600 dark:text-slate-400">{t.note}</div>
    </div>
  )
}

function TongguanCard({ name, side }: { name: string; side: SideAnalysis }) {
  const tg = side.xiyong.tongguan
  if (!tg.active) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-500">
        {name}: 无两强相战
      </div>
    )
  }
  const tone = tg.bridgePresent ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/40 bg-rose-500/5'
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${tone}`}>
      <div className="flex items-baseline gap-2 mb-0.5">
        <span className="text-slate-500">{name}</span>
        {tg.a && <WxBadge wx={tg.a} />}
        <span className="text-slate-400">↔</span>
        {tg.b && <WxBadge wx={tg.b} />}
        <span className="text-slate-400 mx-1">桥</span>
        {tg.bridgeWx && <WxBadge wx={tg.bridgeWx} />}
        <span className={`ml-auto text-[10px] ${tg.bridgePresent
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-rose-700 dark:text-rose-400'}`}>
          {tg.bridgePresent ? '✓ 有桥' : '✗ 无桥'}
        </span>
      </div>
      <div className="text-[11px] text-slate-600 dark:text-slate-400">{tg.note}</div>
      <div className="text-[10px] opacity-70">{tg.bridgeNote}</div>
    </div>
  )
}

function GanZhiCard({ name, side }: { name: string; side: SideAnalysis }) {
  const gz = side.xiyong.ganZhi
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs leading-relaxed">
      <div className="text-slate-500 mb-1">{name}</div>
      <div className="grid grid-cols-4 gap-1">
        {gz.map((g) => (
          <div key={g.pos} className={`rounded border px-1 py-0.5 text-center text-[10px] ${GANZHI_TONE[g.type]}`}>
            <div className="opacity-70">{g.pos}柱</div>
            <div className="font-bold leading-tight">
              <span className={WUXING_TEXT[g.ganWx] ?? ''}>{g.gan}</span>
              <span className={WUXING_TEXT[g.zhiWx] ?? ''}>{g.zhi}</span>
            </div>
            <div className="text-[9px]">{g.type}</div>
          </div>
        ))}
      </div>
      {gz.some((g) => g.type !== '中性' && g.note) && (
        <div className="text-[10px] mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
          {gz.filter((g) => g.type !== '中性' && g.note).map((g) => (
            <div key={g.pos}>{g.pos}: {g.note}</div>
          ))}
        </div>
      )}
    </div>
  )
}

function WxBadge({ wx }: { wx: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full font-bold text-[10px] border align-middle ${WUXING_TEXT[wx]} ${WUXING_BG_SOFT[wx]} ${WUXING_BORDER[wx]}`}
    >{wx}</span>
  )
}

function CatBadge({ cat, children }: { cat: '用神' | '喜神' | '忌神'; children: React.ReactNode }) {
  return (
    <span className={`inline-block px-1 rounded border text-[9px] align-middle ${XIYONG_TONE[cat]}`}>
      {children}
    </span>
  )
}

function SupplyRow({
  from, to, primaryWx, primaryN, secondaryWx, secondaryN,
}: {
  from: string; to: string
  primaryWx: string | null; primaryN: number
  secondaryWx: string | null; secondaryN: number
}) {
  const total = primaryN + secondaryN
  const tone = total >= 3
    ? 'border-emerald-500/40 bg-emerald-500/5'
    : total >= 1
      ? 'border-amber-500/40 bg-amber-500/5'
      : 'border-slate-200 dark:border-slate-700'
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${tone}`}>
      <div className="text-slate-500 mb-0.5">{from} → {to}</div>
      {primaryWx && (
        <div>用神 <WxBadge wx={primaryWx} /> <span className="font-medium tabular-nums">{primaryN} 位</span></div>
      )}
      {secondaryWx && (
        <div>喜神 <WxBadge wx={secondaryWx} /> <span className="font-medium tabular-nums">{secondaryN} 位</span></div>
      )}
      {!primaryWx && !secondaryWx && <div className="text-slate-500">{to} 用神不明确</div>}
    </div>
  )
}

function TiaohouSupply({ from, to, wx, n }: { from: string; to: string; wx: string; n: number }) {
  const tone = n >= 1 ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${tone}`}>
      <div className="text-slate-500 mb-0.5">{from} → {to} 调候</div>
      <div>需 <WxBadge wx={wx} /> <span className="font-medium tabular-nums">{n} 位</span>
        {n === 0 && <span className="text-rose-600 dark:text-rose-400 ml-2 text-[10px]">⚠ 缺</span>}
      </div>
    </div>
  )
}

function AvoidRow({
  from, to, avoidWx, n,
}: { from: string; to: string; avoidWx: string[]; n: number }) {
  const tone = n >= 3
    ? 'border-rose-500/40 bg-rose-500/5'
    : n >= 1
      ? 'border-amber-500/40 bg-amber-500/5'
      : 'border-slate-200 dark:border-slate-700'
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${tone}`}>
      <div className="text-slate-500 mb-0.5">{from} → {to} 忌神</div>
      <div className="flex flex-wrap items-center gap-1">
        {avoidWx.length === 0
          ? <span className="text-slate-500">无</span>
          : <>
              {avoidWx.map((w, i) => <WxBadge key={i} wx={w} />)}
              <span className="ml-1 font-medium tabular-nums">共 {n} 位</span>
            </>
        }
      </div>
    </div>
  )
}

function DistRow({ name, dist }: { name: string; dist: Record<string, number> }) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs">
      <div className="text-slate-500 mb-1">{name}</div>
      <div className="space-y-1">
        {(['木', '火', '土', '金', '水'] as const).map((w) => {
          const n = dist[w] ?? 0
          const pct = (n / total) * 100
          return (
            <div key={w} className="flex items-center gap-2">
              <span className={`w-4 text-center font-bold ${WUXING_TEXT[w]}`}>{w}</span>
              <div className="flex-1 h-3 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                <div className={`absolute inset-y-0 left-0 ${WUXING_BG_SOFT[w]}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-6 text-right tabular-nums text-slate-500">{n}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
