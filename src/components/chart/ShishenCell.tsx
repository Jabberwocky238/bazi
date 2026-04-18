import { cellBase } from '@/lib/ui'
import { WUXING_TEXT } from '@/lib/wuxing'
import { SkillLink } from '@@/SkillLink'

export function ShishenCell({ shishen, wuxing }: { shishen: string; wuxing: string }) {
  if (!shishen) {
    return <td className={cellBase + ' text-slate-300 dark:text-slate-700'}>—</td>
  }
  return (
    <td className={cellBase}>
      <SkillLink
        category="shishen"
        name={shishen}
        className={`font-medium ${WUXING_TEXT[wuxing] ?? 'text-slate-800 dark:text-slate-200'}`}
      >
        {shishen}
      </SkillLink>
    </td>
  )
}
