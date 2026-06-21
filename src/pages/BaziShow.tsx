import { Link } from 'react-router-dom'
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

export default function BaziShow() {
  const solarStr = useBazi((s) => s.solarStr)
  const trueSolarStr = useBazi((s) => s.trueSolarStr)
  const lunarStr = useBazi((s) => s.lunarStr)
  const pillars = useBazi((s) => s.pillars)

  return (
    <ErrorBoundary name="BaziShow">
      <div className="mb-3">
        <Link
          to="/"
          className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline decoration-dotted underline-offset-2"
        >
          ← 修改输入
        </Link>
      </div>
      <div className="grid gap-5 md:gap-6">
        <section className="min-w-0">
          <ErrorBoundary name="BaziMeta"><BaziMeta solar={solarStr} trueSolar={trueSolarStr} lunar={lunarStr} /></ErrorBoundary>
          <ErrorBoundary name="BaziChart"><BaziChart pillars={pillars} /></ErrorBoundary>
          <ErrorBoundary name="DaYunPanel"><DaYunPanel /></ErrorBoundary>
          <ErrorBoundary name="GejuPanel"><GejuPanel /></ErrorBoundary>
          <ErrorBoundary name="BaziRelationsPanel"><BaziRelationsPanel pillars={pillars} /></ErrorBoundary>
          <ErrorBoundary name="ElementsPanel"><ElementsPanel /></ErrorBoundary>
          <ErrorBoundary name="StrengthPanel"><StrengthPanel /></ErrorBoundary>
          <ErrorBoundary name="GanZhiPanel"><GanZhiPanel /></ErrorBoundary>
          <ErrorBoundary name="XiyongPanel"><XiyongPanel /></ErrorBoundary>
          <ErrorBoundary name="SkillIndex"><SkillIndex pillars={pillars} /></ErrorBoundary>
        </section>
      </div>
    </ErrorBoundary>
  )
}
