import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { useBazi } from '@@/stores'
import { BaziMeta } from '@@/BaziMeta'
import { BaziChart } from '@@/chart/BaziChart'
import { BaziRelationsPanel } from '@@/BaziRelationsPanel'
import { SkillIndex } from '@@/SkillIndex'
import { ElementsPanel } from '@@/ElementsPanel'
import { GejuPanel } from '@@/GejuPanel'
import { DaYunPanel } from '@@/DaYunPanel'
import { StrengthPanel } from '@@/StrengthPanel'
import { XiyongPanel } from '@@/XiyongPanel'
import { GanZhiPanel } from '@@/GanZhiPanel'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { DistributionPanel } from '@@/DistributionPanel'
import { CopyBaziButton } from '@@/CopyBaziButton'

export default function BaziShow() {
  const solarStr = useBazi((s) => s.solarStr)
  const trueSolarStr = useBazi((s) => s.trueSolarStr)
  const lunarStr = useBazi((s) => s.lunarStr)
  const pillars = useBazi((s) => s.pillars)
  const shishen = useBazi((s) => s.shishen)
  const analysisRef = useRef<HTMLElement>(null)

  return (
    <ErrorBoundary name="BaziShow">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline decoration-dotted underline-offset-2"
        >
          ← 修改输入
        </Link>
        <CopyBaziButton
          solar={solarStr}
          trueSolar={trueSolarStr}
          lunar={lunarStr}
          pillars={pillars}
          shishen={shishen}
          contentRef={analysisRef}
        />
      </div>
      <div className="grid gap-5 md:gap-6">
        <section ref={analysisRef} className="min-w-0">
          <div data-copy-exclude>
            <ErrorBoundary name="BaziMeta"><BaziMeta solar={solarStr} trueSolar={trueSolarStr} lunar={lunarStr} /></ErrorBoundary>
            <ErrorBoundary name="BaziChart"><BaziChart pillars={pillars} shishen={shishen} /></ErrorBoundary>
          </div>
          <ErrorBoundary name="DistributionPanel"><DistributionPanel /></ErrorBoundary>
          <ErrorBoundary name="DaYunPanel"><DaYunPanel /></ErrorBoundary>
          <ErrorBoundary name="GejuPanel"><GejuPanel /></ErrorBoundary>
          <ErrorBoundary name="BaziRelationsPanel"><BaziRelationsPanel pillars={pillars} /></ErrorBoundary>
          <ErrorBoundary name="ElementsPanel"><ElementsPanel /></ErrorBoundary>
          <ErrorBoundary name="StrengthPanel"><StrengthPanel /></ErrorBoundary>
          <ErrorBoundary name="GanZhiPanel"><GanZhiPanel /></ErrorBoundary>
          <ErrorBoundary name="XiyongPanel"><XiyongPanel /></ErrorBoundary>
          <ErrorBoundary name="SkillIndex"><SkillIndex pillars={pillars} shishen={shishen} /></ErrorBoundary>
        </section>
      </div>
    </ErrorBoundary>
  )
}
