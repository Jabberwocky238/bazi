import { useState } from 'react'
import { useBazi } from '@/lib'
import { BaziForm } from '@@/BaziForm'
import { BaziMeta } from '@@/BaziMeta'
import { BaziChart } from '@@/chart/BaziChart'
import { SkillIndex } from '@@/SkillIndex'
import { SkillPanel } from '@@/SkillPanel'
import { BasicsPanel } from '@@/BasicsPanel'
import { ElementsPanel } from '@@/ElementsPanel'
import { GejuPanel } from '@@/GejuPanel'
import { DaYunPanel } from '@@/DaYunPanel'
import { StrengthPanel } from '@@/StrengthPanel'
import { XiyongPanel } from '@@/XiyongPanel'
import { GanZhiPanel } from '@@/GanZhiPanel'
import { ErrorBoundary } from '@@/ErrorBoundary'
import { DisclaimerDialog } from '@@/DisclaimerDialog'
import { GenericLayout } from '@@/GenericLayout'

function App() {
  const solarStr = useBazi((s) => s.solarStr)
  const trueSolarStr = useBazi((s) => s.trueSolarStr)
  const lunarStr = useBazi((s) => s.lunarStr)
  const pillars = useBazi((s) => s.pillars)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

  return (
    <GenericLayout
      errorBoundaryName="App"
      title="八字补完计划"
      link={{ href: '/hepan', text: '← 合盘分析' }}
      description="点击任意词条查看释义"
      descriptionRight={
        <button
          type="button"
          onClick={() => setDisclaimerOpen(true)}
          className="text-[10px] md:text-[11px] text-slate-400 dark:text-slate-600 hover:text-amber-700 dark:hover:text-amber-400 underline decoration-dotted underline-offset-2"
        >
          免责声明
        </button>
      }
    >
      <DisclaimerDialog open={disclaimerOpen} onClose={() => setDisclaimerOpen(false)} />

      <div className="grid gap-5 md:gap-6 md:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
        <section className="min-w-0">
          <ErrorBoundary name="BaziForm"><BaziForm /></ErrorBoundary>
          <ErrorBoundary name="BaziMeta"><BaziMeta solar={solarStr} trueSolar={trueSolarStr} lunar={lunarStr} /></ErrorBoundary>
          <ErrorBoundary name="BaziChart"><BaziChart pillars={pillars} /></ErrorBoundary>
          <ErrorBoundary name="GejuPanel"><GejuPanel /></ErrorBoundary>
          <ErrorBoundary name="DaYunPanel"><DaYunPanel /></ErrorBoundary>
          <ErrorBoundary name="ElementsPanel"><ElementsPanel /></ErrorBoundary>
          <ErrorBoundary name="StrengthPanel"><StrengthPanel /></ErrorBoundary>
          <ErrorBoundary name="GanZhiPanel"><GanZhiPanel /></ErrorBoundary>
          <ErrorBoundary name="XiyongPanel"><XiyongPanel /></ErrorBoundary>
          <ErrorBoundary name="SkillIndex"><SkillIndex pillars={pillars} /></ErrorBoundary>
          <ErrorBoundary name="BasicsPanel"><BasicsPanel /></ErrorBoundary>
        </section>

        <section className="min-w-0">
          <ErrorBoundary name="SkillPanel"><SkillPanel /></ErrorBoundary>
        </section>
      </div>
    </GenericLayout>
  )
}

export default App
