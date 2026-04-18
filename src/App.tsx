import { useBaziStore } from '@/lib/store'
import { BaziForm } from '@@/BaziForm'
import { BaziMeta } from '@@/BaziMeta'
import { BaziChart } from '@@/chart/BaziChart'
import { SkillIndex } from '@@/SkillIndex'
import { SkillPanel } from '@@/SkillPanel'
import { BasicsPanel } from '@@/BasicsPanel'
import { ShishenProportion } from '@@/ShishenProportion'
import { DayMasterRelations } from '@@/DayMasterRelations'
import { GejuPanel } from '@@/GejuPanel'
import { Footer } from '@@/Footer'

function App() {
  const result = useBaziStore((s) => s.result)

  return (
    <main className="mx-auto max-w-7xl px-3 md:px-6 pt-5 md:pt-10 pb-10 md:pb-16">
      <header className="mb-5 md:mb-6">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">八字排盘</h1>
        <p className="mt-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
          公历出生时间 → 四柱、十神、神煞 · 点击任意词条查看释义
        </p>
      </header>

      <div className="grid gap-5 md:gap-6 md:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
        <section className="min-w-0">
          <BaziForm />
          <BaziMeta solar={result.solarStr} lunar={result.lunarStr} />
          <BaziChart pillars={result.pillars} />
          <DayMasterRelations />
          <GejuPanel pillars={result.pillars} />
          <ShishenProportion pillars={result.pillars} />
          <SkillIndex pillars={result.pillars} />
          <BasicsPanel />
        </section>

        <section className="min-w-0">
          <SkillPanel />
        </section>
      </div>

      <Footer />
    </main>
  )
}

export default App
