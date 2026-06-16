import { useMemo } from 'react'
import type { Pillar } from '@/lib'
import { useBaziStore } from '@@/stores'
import {
  ganWuxing,
  zhiWuxing,
  GENERATES,
  CONTROLS,
  pairwiseGan,
  pairwiseZhi,
  type Gan,
  type Zhi,
  type PairResult,
} from '@jabberwocky238/bazi-engine'
import { WUXING_SVG_COLOR } from '@@/css'
import type { WuXing } from '@/lib'

interface BaziChar {
  key: string
  label: string
  value: string
  wuxing: string
}

interface Relation {
  kind: '生' | '克' | '助'
  direction: 'forward' | 'backward' | 'both'
}

function relationOf(a: BaziChar, b: BaziChar): Relation | null {
  if (!a.value || !b.value || !a.wuxing || !b.wuxing) return null
  if (a.wuxing === b.wuxing) return { kind: '助', direction: 'both' }
  if (GENERATES[a.wuxing as WuXing] === b.wuxing) return { kind: '生', direction: 'forward' }
  if (CONTROLS[a.wuxing as WuXing] === b.wuxing) return { kind: '克', direction: 'forward' }
  if (GENERATES[b.wuxing as WuXing] === a.wuxing) return { kind: '生', direction: 'backward' }
  if (CONTROLS[b.wuxing as WuXing] === a.wuxing) return { kind: '克', direction: 'backward' }
  return null
}

function verticalRelationOf(gan: BaziChar, zhi: BaziChar): { type: string; kind: '生' | '克' | '助' } | null {
  if (!gan.wuxing || !zhi.wuxing) return null
  const gw = gan.wuxing as WuXing
  const zw = zhi.wuxing as WuXing

  if (gw === zw) return { type: '同气', kind: '助' }
  if (GENERATES[gw] === zw) return { type: '得覆', kind: '生' }
  if (GENERATES[zw] === gw) return { type: '得载', kind: '生' }
  if (CONTROLS[gw] === zw) return { type: '盖头', kind: '克' }
  if (CONTROLS[zw] === gw) return { type: '截脚', kind: '克' }
  return null
}

// 复用全局定义的五行颜色
const WUXING_COLORS = WUXING_SVG_COLOR

export function BaziRelationsPanel({ pillars }: { pillars: Pillar[] }) {
  if (pillars.length !== 4) return null
  const extraPillars = useBaziStore((s) => s.extraPillars)

  const dayun = extraPillars.find((p) => p.label === '大运')
  const liunian = extraPillars.find((p) => p.label === '流年')
  const liuyue = extraPillars.find((p) => p.label === '流月')

  const extraList: typeof extraPillars = []
  if (liuyue) extraList.push(liuyue)
  if (liunian) extraList.push(liunian)
  if (dayun) extraList.push(dayun)

  const stems: BaziChar[] = pillars.map((p) => ({
    key: `${p.label}-gan`,
    label: `${p.label[0]}干`,
    value: p.gan,
    wuxing: p.ganWuxing,
  }))
  const branches: BaziChar[] = pillars.map((p) => ({
    key: `${p.label}-zhi`,
    label: `${p.label[0]}支`,
    value: p.zhi,
    wuxing: p.zhiWuxing,
  }))

  const extraStems: BaziChar[] = extraList.map((p) => ({
    key: `extra-${p.label}-gan`,
    label: p.label,
    value: p.gan,
    wuxing: ganWuxing(p.gan) ?? '',
  }))
  const extraBranches: BaziChar[] = extraList.map((p) => ({
    key: `extra-${p.label}-zhi`,
    label: '',
    value: p.zhi,
    wuxing: zhiWuxing(p.zhi) ?? '',
  }))

  const extraCount = extraList.length

  // 所有天干两两关系（包括相邻和不相邻）
  const ganPairs = useMemo(() => {
    const results: { from: number; to: number; pair: PairResult | null }[] = []
    for (let i = 0; i < stems.length; i++) {
      for (let j = i + 1; j < stems.length; j++) {
        results.push({
          from: extraCount + i,
          to: extraCount + j,
          pair: pairwiseGan(stems[i].value as Gan, stems[j].value as Gan),
        })
      }
    }
    extraStems.forEach((extra, ei) => {
      stems.forEach((stem, si) => {
        results.push({
          from: ei,
          to: extraCount + si,
          pair: pairwiseGan(extra.value as Gan, stem.value as Gan),
        })
      })
    })
    return results.filter(r => r.pair)
  }, [stems, extraStems, extraCount])

  // 所有地支两两关系
  const zhiPairs = useMemo(() => {
    const results: { from: number; to: number; pair: PairResult | null }[] = []
    for (let i = 0; i < branches.length; i++) {
      for (let j = i + 1; j < branches.length; j++) {
        results.push({
          from: extraCount + i,
          to: extraCount + j,
          pair: pairwiseZhi(branches[i].value as Zhi, branches[j].value as Zhi),
        })
      }
    }
    extraBranches.forEach((extra, ei) => {
      branches.forEach((branch, bi) => {
        results.push({
          from: ei,
          to: extraCount + bi,
          pair: pairwiseZhi(extra.value as Zhi, branch.value as Zhi),
        })
      })
    })
    return results.filter(r => r.pair)
  }, [branches, extraBranches, extraCount])

  // 相邻天干的生克关系（用于中间箭头）
  const adjacentGanRels = useMemo(() => {
    const results: { col: number; rel: Relation | null }[] = []
    for (let i = 0; i < stems.length - 1; i++) {
      results.push({
        col: extraCount + i,
        rel: relationOf(stems[i], stems[i + 1]),
      })
    }
    return results
  }, [stems, extraCount])

  // 相邻地支的生克关系
  const adjacentZhiRels = useMemo(() => {
    const results: { col: number; rel: Relation | null }[] = []
    for (let i = 0; i < branches.length - 1; i++) {
      results.push({
        col: extraCount + i,
        rel: relationOf(branches[i], branches[i + 1]),
      })
    }
    return results
  }, [branches, extraCount])

  // 垂直关系
  const verticalRels = useMemo(() => {
    return stems.map((stem, i) => ({
      col: extraCount + i,
      rel: verticalRelationOf(stem, branches[i]),
    })).filter(r => r.rel)
  }, [stems, branches, extraCount])

  // SVG布局参数 - 增加列宽给箭头留空间
  const colWidth = 75
  const gap = extraCount > 0 ? 15 : 0
  const cardWidth = 60
  const cardHeight = 72
  const rowGap = 36

  const totalCols = extraCount + 4 + (extraCount > 0 ? 1 : 0)
  const svgWidth = totalCols * colWidth + 40

  // 动态计算高度 - 每个关系线一行，确保不重叠
  const lineHeight = 22
  const topSpace = ganPairs.length * lineHeight + 30
  const bottomSpace = zhiPairs.length * lineHeight + 30

  const ganY = topSpace
  const zhiY = ganY + cardHeight + rowGap
  const svgHeight = zhiY + cardHeight + bottomSpace

  const getColX = (colIdx: number, isExtra: boolean) => {
    if (isExtra) return 20 + colIdx * colWidth + colWidth / 2
    const extraWidth = extraCount * colWidth + gap
    return 20 + extraWidth + (colIdx - extraCount) * colWidth + colWidth / 2
  }

  const renderCharBlock = (x: number, y: number, char: BaziChar, isExtra: boolean) => {
    const color = WUXING_COLORS[char.wuxing] || '#64748b'
    const borderColor = isExtra ? '#a78bfa' : color

    return (
      <g key={`${char.key}-${x}-${y}`}>
        <rect
          x={x - cardWidth / 2}
          y={y}
          width={cardWidth}
          height={cardHeight}
          rx="12"
          fill="none"
          stroke={borderColor}
          strokeWidth="2"
        />
        <text x={x} y={y + 18} textAnchor="middle" className="fill-slate-500 text-[10px]" style={{ letterSpacing: '0.1em' }}>
          {char.label}
        </text>
        <text x={x} y={y + 50} textAnchor="middle" className="text-2xl font-bold" style={{ fill: color }}>
          {char.value}
        </text>
        <text x={x} y={y + 70} textAnchor="middle" className="text-[11px] font-medium" style={{ fill: color }}>
          {char.wuxing}
        </text>
      </g>
    )
  }

  return (
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400">
          八字生克图
        </h2>
        <span className="text-[10px] text-slate-400 dark:text-slate-600">
          显示所有天干地支两两关系
        </span>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <div style={{ minWidth: svgWidth, maxWidth: '100%', margin: '0 auto' }}>
          <svg
            width="100%"
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="xMidYMid meet"
            className="overflow-visible"
          >
        {extraCount > 0 && (
          <line
            x1={20 + extraCount * colWidth + gap / 2}
            y1={topSpace - 20}
            x2={20 + extraCount * colWidth + gap / 2}
            y2={zhiY + cardHeight + 20}
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        )}

        {/* 天干关系线 - 灰色实线，每个关系独立一行 */}
        {ganPairs.map(({ from, to, pair }, idx) => {
          if (!pair) return null
          const x1 = getColX(from, from < extraCount)
          const x2 = getColX(to, to < extraCount)
          const y = ganY - 15 - idx * 22

          return (
            <g key={`gan-line-${idx}`}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke="#6b7280" strokeWidth="1.5" />
              <circle cx={x1} cy={y} r="3" fill="#6b7280" />
              <circle cx={x2} cy={y} r="3" fill="#6b7280" />
              <text x={(x1 + x2) / 2} y={y - 5} textAnchor="middle" className="fill-slate-600 text-[10px]">
                {pair.note}
              </text>
            </g>
          )
        })}

        {/* 地支关系线 - 灰色实线，每个关系独立一行 */}
        {zhiPairs.map(({ from, to, pair }, idx) => {
          if (!pair) return null
          const x1 = getColX(from, from < extraCount)
          const x2 = getColX(to, to < extraCount)
          const y = zhiY + cardHeight + 15 + idx * 22

          return (
            <g key={`zhi-line-${idx}`}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke="#6b7280" strokeWidth="1.5" />
              <circle cx={x1} cy={y} r="3" fill="#6b7280" />
              <circle cx={x2} cy={y} r="3" fill="#6b7280" />
              <text x={(x1 + x2) / 2} y={y + 14} textAnchor="middle" className="fill-slate-600 text-[10px]">
                {pair.note}
              </text>
            </g>
          )
        })}

        {/* 额外列 - 天干 */}
        {extraStems.map((char, i) => renderCharBlock(getColX(i, true), ganY, char, true))}

        {/* 主局天干 */}
        {stems.map((char, i) => renderCharBlock(getColX(extraCount + i, false), ganY, char, false))}

        {/* 天干相邻之间的箭头 */}
        {adjacentGanRels.map(({ col, rel }, idx) => {
          if (!rel) return null
          const x = getColX(col, false) + colWidth / 2
          const y = ganY + cardHeight / 2
          const color = rel.kind === '克' ? '#f43f5e' : '#10b981'

          return (
            <g key={`gan-arrow-${idx}`}>
              <line x1={x - 20} y1={y} x2={x + 20} y2={y} stroke={color} strokeWidth="2" />
              {rel.direction === 'forward' && <polygon points={`${x + 15},${y - 4} ${x + 25},${y} ${x + 15},${y + 4}`} fill={color} />}
              {rel.direction === 'backward' && <polygon points={`${x - 15},${y - 4} ${x - 25},${y} ${x - 15},${y + 4}`} fill={color} />}
              {rel.direction === 'both' && (
                <>
                  <polygon points={`${x + 15},${y - 4} ${x + 25},${y} ${x + 15},${y + 4}`} fill={color} />
                  <polygon points={`${x - 15},${y - 4} ${x - 25},${y} ${x - 15},${y + 4}`} fill={color} />
                </>
              )}
              <text x={x} y={y - 12} textAnchor="middle" className="text-[10px] font-medium" style={{ fill: color }}>
                {rel.kind}
              </text>
            </g>
          )
        })}

        {/* 垂直关系 */}
        {verticalRels.map(({ col, rel }, idx) => {
          if (!rel) return null
          const x = getColX(col, false)
          const y = ganY + cardHeight + 5
          const color = rel.kind === '克' ? '#f43f5e' : '#10b981'

          return (
            <g key={`v-rel-${idx}`}>
              <line x1={x} y1={y} x2={x} y2={y + rowGap - 10} stroke={color} strokeWidth="2" />
              <polygon points={`${x - 4},${y + rowGap - 18} ${x},${y + rowGap - 10} ${x + 4},${y + rowGap - 18}`} fill={color} />
              <text x={x + 8} y={y + rowGap / 2} textAnchor="start" className="text-[10px] font-medium" style={{ fill: color }}>
                {rel.type}
              </text>
            </g>
          )
        })}

        {/* 额外列 - 地支 */}
        {extraBranches.map((char, i) => renderCharBlock(getColX(i, true), zhiY, char, true))}

        {/* 主局地支 */}
        {branches.map((char, i) => renderCharBlock(getColX(extraCount + i, false), zhiY, char, false))}

        {/* 地支相邻之间的箭头 */}
        {adjacentZhiRels.map(({ col, rel }, idx) => {
          if (!rel) return null
          const x = getColX(col, false) + colWidth / 2
          const y = zhiY + cardHeight / 2
          const color = rel.kind === '克' ? '#f43f5e' : '#10b981'

          return (
            <g key={`zhi-arrow-${idx}`}>
              <line x1={x - 20} y1={y} x2={x + 20} y2={y} stroke={color} strokeWidth="2" />
              {rel.direction === 'forward' && <polygon points={`${x + 15},${y - 4} ${x + 25},${y} ${x + 15},${y + 4}`} fill={color} />}
              {rel.direction === 'backward' && <polygon points={`${x - 15},${y - 4} ${x - 25},${y} ${x - 15},${y + 4}`} fill={color} />}
              {rel.direction === 'both' && (
                <>
                  <polygon points={`${x + 15},${y - 4} ${x + 25},${y} ${x + 15},${y + 4}`} fill={color} />
                  <polygon points={`${x - 15},${y - 4} ${x - 25},${y} ${x - 15},${y + 4}`} fill={color} />
                </>
              )}
              <text x={x} y={y - 12} textAnchor="middle" className="text-[10px] font-medium" style={{ fill: color }}>
                {rel.kind}
              </text>
            </g>
          )
        })}
          </svg>
        </div>
      </div>
    </section>
  )
}