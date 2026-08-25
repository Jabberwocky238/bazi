import { type Pillar, type PillarShishenView, skillUrl, type SkillCategory } from 'bazilib'
import { SkillLink } from '@@/SkillLink'

interface IndexItem {
  category: SkillCategory
  name: string
  sub?: string
}

function build(pillars: Pillar[], shishen: PillarShishenView[]): IndexItem[] {
  const seen = new Set<string>()
  const out: IndexItem[] = []
  const labels = ['年', '月', '日', '时']

  const push = (it: IndexItem) => {
    if (!skillUrl(it.category, it.name)) return
    const key = `${it.category}:${it.name}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(it)
  }

  pillars.forEach((p, i) => push({ category: 'tiangan', name: p.pillar.gan.str, sub: `${labels[i]}干` }))
  pillars.forEach((p, i) => {
    const ss = shishen[i]?.gan
    if (ss) push({ category: 'shishen', name: ss.str })
  })
  pillars.forEach((p) => p.shensha.forEach((s) => push({ category: 'shensha', name: s })))
  return out
}

export function SkillIndex({
  pillars,
  shishen,
}: {
  pillars: Pillar[]
  shishen: PillarShishenView[]
}) {
  const items = build(pillars, shishen)
  if (!items.length) return null

  return (
    <section className="mt-6">
      <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400 mb-3">
        本盘词条索引
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <SkillLink
            key={`${it.category}:${it.name}`}
            category={it.category}
            name={it.name}
            subtitle={it.sub}
            className="text-sm px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            {it.name}
          </SkillLink>
        ))}
      </div>
    </section>
  )
}
