import { useMemo, useState } from 'react'
import { computeFromState } from '@@/stores/compute'
import type { Pillar, BaziResult } from '@/lib'
import { EMPTY_PILLAR } from '@/lib'
import { BaziChart } from '@@/chart/BaziChart'
import { BaziMeta } from '@@/BaziMeta'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { SkillPanel } from '@@/SkillPanel'
import { GenericLayout } from '@@/GenericLayout'
import { HepanInput, defaultA, defaultB, type HepanState } from './HepanInput'
import { HepanCrossPanel } from './HepanCrossPanel'
import { HepanXiyongMatch } from './HepanXiyongMatch'

const EMPTY_RESULT: BaziResult = {
  solarStr: '', trueSolarStr: '', lunarStr: '输入无效',
  pillars: [EMPTY_PILLAR, EMPTY_PILLAR, EMPTY_PILLAR, EMPTY_PILLAR],
  hourKnown: false,
}

export default function HepanApp() {
  const [a, setA] = useState<HepanState>(defaultA)
  const [b, setB] = useState<HepanState>(defaultB)

  const aR = useMemo(() => computeFromState(a)?.bazi ?? EMPTY_RESULT, [a])
  const bR = useMemo(() => computeFromState(b)?.bazi ?? EMPTY_RESULT, [b])

  return (
    <GenericLayout
      errorBoundaryName="HepanApp"
      title="八字合盘"
      link={{ href: '/', text: '← 返回主盘' }}
      description="输入两人出生信息 — 干支互动 / 用神配对 自动比对"
    >
      <div className="grid grid-cols-2 gap-2 md:gap-6">
        <Side label={a.name || '左'}
              state={a} onChange={setA} pillars={aR.pillars}
              solar={aR.solarStr} trueSolar={aR.trueSolarStr} lunar={aR.lunarStr} />
        <Side label={b.name || '右'}
              state={b} onChange={setB} pillars={bR.pillars}
              solar={bR.solarStr} trueSolar={bR.trueSolarStr} lunar={bR.lunarStr} />
      </div>

      <ErrorBoundary name="HepanCrossPanel">
        <HepanCrossPanel
          a={aR.pillars} aName={a.name || '左'}
          b={bR.pillars} bName={b.name || '右'}
        />
      </ErrorBoundary>

      <ErrorBoundary name="HepanXiyongMatch">
        <HepanXiyongMatch a={aR.pillars} b={bR.pillars} aName={a.name || '左'} bName={b.name || '右'} />
      </ErrorBoundary>

      <p className="mt-6 text-[10px] text-slate-400 dark:text-slate-600 text-right leading-relaxed">
        合盘仅供参考 · 用神 / 互动只是其中两层 · 实际配偶 / 合伙考量仍需综合岁运、宫位、神煞与现实磨合
      </p>

      <ErrorBoundary name="SkillPanel"><SkillPanel /></ErrorBoundary>
    </GenericLayout>
  )
}

interface SideProps {
  label: string
  state: HepanState
  onChange: (s: HepanState) => void
  pillars: Pillar[]
  solar: string
  trueSolar: string
  lunar: string
}

function Side({ label, state, onChange, pillars, solar, trueSolar, lunar }: SideProps) {
  return (
    <section className="min-w-0 flex flex-col gap-2 md:gap-3 hepan-side">
      <ErrorBoundary name={`HepanInput-${label}`}>
        <HepanInput label={label} state={state} onChange={onChange} />
      </ErrorBoundary>
      <ErrorBoundary name={`BaziMeta-${label}`}>
        <BaziMeta solar={solar} trueSolar={trueSolar} lunar={lunar} />
      </ErrorBoundary>
      <ErrorBoundary name={`BaziChart-${label}`}>
        <BaziChart pillars={pillars} />
      </ErrorBoundary>
    </section>
  )
}
