import { Link, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { computeFromState } from '@@/stores/compute'
import { EMPTY_PILLAR } from '@/lib'
import { BaziChart } from '@@/chart/BaziChart'
import { BaziMeta } from '@@/BaziMeta'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { GenericLayout } from '@@/GenericLayout'
import { HepanCrossPanel } from '@@/HepanCrossPanel'
import { HepanXiyongMatch } from '@@/HepanXiyongMatch'
import type { HepanState } from '@@/HepanInput'
import type { ExtendedDetailedPillar } from '@/lib'

interface LocationState {
  a: HepanState
  b: HepanState
}

const EMPTY_RESULT = {
  solarStr: '', trueSolarStr: '', lunarStr: '',
  pillars: [EMPTY_PILLAR, EMPTY_PILLAR, EMPTY_PILLAR, EMPTY_PILLAR],
  hourKnown: false,
}

export default function HepanShow() {
  const location = useLocation()
  const state = location.state as LocationState | undefined

  const a = state?.a
  const b = state?.b

  const aResult = useMemo(() => (a ? computeFromState(a)?.bazi : null) || EMPTY_RESULT, [a])
  const bResult = useMemo(() => (b ? computeFromState(b)?.bazi : null) || EMPTY_RESULT, [b])

  const aName = a?.name || '左'
  const bName = b?.name || '右'

  if (!a || !b) {
    return (
      <GenericLayout errorBoundaryName="HepanShow" title="八字合盘" link={<Link to="/hepan-input">← 输入信息</Link>}>
        <div className="text-center py-8 text-slate-500">
          请先输入两人的出生信息
        </div>
      </GenericLayout>
    )
  }

  return (
    <GenericLayout
      errorBoundaryName="HepanShow"
      title="八字合盘"
      link={<Link to="/hepan-input">← 修改输入</Link>}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-2 md:gap-6">
          <Side
            label={aName}
            result={aResult}
          />
          <Side
            label={bName}
            result={bResult}
          />
        </div>

        <ErrorBoundary name="HepanCrossPanel">
          <HepanCrossPanel
            a={aResult.pillars}
            aName={aName}
            b={bResult.pillars}
            bName={bName}
          />
        </ErrorBoundary>

        <ErrorBoundary name="HepanXiyongMatch">
          <HepanXiyongMatch
            a={aResult.pillars}
            b={bResult.pillars}
            aName={aName}
            bName={bName}
          />
        </ErrorBoundary>

        <p className="text-[10px] text-slate-400 dark:text-slate-600 text-right leading-relaxed">
          合盘仅供参考 · 用神 / 互动只是其中两层 · 实际配偶 / 合伙考量仍需综合岁运、宫位、神煞与现实磨合
        </p>
      </div>
    </GenericLayout>
  )
}

interface SideProps {
  label: string
  result: { solarStr: string; trueSolarStr: string; lunarStr: string; pillars: ExtendedDetailedPillar[] }
}

function Side({ label, result }: SideProps) {
  return (
    <section className="min-w-0 flex flex-col gap-2 md:gap-3">
      <ErrorBoundary name={`BaziMeta-${label}`}>
        <BaziMeta solar={result.solarStr} trueSolar={result.trueSolarStr} lunar={result.lunarStr} />
      </ErrorBoundary>
      <ErrorBoundary name={`BaziChart-${label}`}>
        <BaziChart pillars={result.pillars} />
      </ErrorBoundary>
    </section>
  )
}
