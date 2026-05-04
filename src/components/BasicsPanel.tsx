import { skillNames } from '@/lib'
import { SkillLink } from '@@/SkillLink'

export function BasicsPanel() {
  const items = skillNames('jichu')
  if (!items.length) return null

  return (
    <section className="mt-6">
      <h2 className="text-xs font-medium tracking-[0.25em] uppercase text-slate-500 dark:text-slate-400 mb-3">
        八字基础
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((n) => (
          <SkillLink
            key={n}
            category="jichu"
            name={n}
            className="text-sm px-3 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          >
            {n}
          </SkillLink>
        ))}
      </div>
    </section>
  )
}
