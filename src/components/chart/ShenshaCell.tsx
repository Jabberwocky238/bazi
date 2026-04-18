import { SkillLink } from '@@/SkillLink'
import { shenshaQuality, type ShenshaQuality } from '@/lib/wuxing'

const CHIP_CLS: Record<ShenshaQuality, string> = {
  good: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/40',
  bad: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
  neutral: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40',
}

function chipCls(name: string): string {
  const base = 'text-xs px-2 py-0.5 rounded-full whitespace-nowrap border'
  return `${base} ${CHIP_CLS[shenshaQuality(name)]}`
}

function normalize(items: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const it of items) {
    const name = it
    if (seen.has(name)) continue
    seen.add(name)
    out.push(name)
  }
  return out
}

export function ShenshaCell({ items }: { items: string[] }) {
  const display = normalize(items)
  return (
    <td className="border-r last:border-r-0 border-slate-200 dark:border-slate-800 p-2.5">
      {display.length ? (
        <div className="flex flex-wrap justify-center gap-1">
          {display.map((s) => (
            <SkillLink key={s} category="shensha" name={s} className={chipCls(s)}>
              {s}
            </SkillLink>
          ))}
        </div>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">—</span>
      )}
    </td>
  )
}
