import { WUXING_TEXT, WUXING_BORDER, WUXING_FROM } from '@@/css'
import { SkillLink } from '@@/SkillLink'

export function GanZhiCell({
  gan,
  zhi,
  ganWuxing,
  zhiWuxing,
}: {
  gan: string
  zhi: string
  ganWuxing: string
  zhiWuxing: string
}) {
  const empty = !gan || !zhi

  return (
    <td
      className={[
        'border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800',
        'bg-gradient-to-b to-transparent border-t-[3px] py-2.5 md:py-4 px-1',
        empty ? 'border-slate-200 dark:border-slate-700' : (WUXING_BORDER[ganWuxing] ?? 'border-slate-300'),
        empty ? '' : (WUXING_FROM[ganWuxing] ?? ''),
      ].join(' ')}
    >
      {empty ? (
        <div className="text-2xl md:text-3xl font-bold leading-none text-slate-300 dark:text-slate-700 select-none">
          ?
        </div>
      ) : (
        <div className="text-3xl md:text-4xl lg:text-5xl font-bold leading-none tracking-wide">
          <div className={WUXING_TEXT[ganWuxing] ?? ''}>
            <SkillLink category="tiangan" name={gan}>{gan}</SkillLink>
          </div>
          <div className={`mt-1 ${WUXING_TEXT[zhiWuxing] ?? ''}`}>
            <SkillLink category="dizhi" name={zhi}>{zhi}</SkillLink>
          </div>
        </div>
      )}
    </td>
  )
}
