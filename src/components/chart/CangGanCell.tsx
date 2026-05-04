import { ganWuxing, type Gan } from '@jabberwocky238/bazi-engine'
import { WUXING_TEXT } from '@@/css'
import { SkillLink } from '@@/SkillLink'

export function CangGanCell({
  gans,
  shishens,
  shishenWuxings,
}: {
  gans: string[]
  shishens: string[]
  shishenWuxings: string[]
}) {
  const hasAny = gans.length > 0

  return (
    <td className="py-2 md:py-2.5 px-1 md:px-2 text-xs md:text-sm border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800 align-middle">
      {hasAny ? (
        <div className="flex flex-col gap-0.5">
          {gans.map((g, i) => {
            const sWx = shishenWuxings[i] ?? ''
            return (
              <div key={i} className="flex items-center justify-center gap-1.5 md:gap-2">
                <SkillLink category="tiangan" name={g}>
                  <span className={`font-bold ${WUXING_TEXT[ganWuxing(g as Gan)] ?? ''}`}>{g}</span>
                </SkillLink>
                <SkillLink category="shishen" name={shishens[i] ?? ''}>
                  <span className={`text-[11px] md:text-xs ${WUXING_TEXT[sWx] ?? 'text-slate-500 dark:text-slate-400'}`}>
                    {shishens[i] ?? ''}
                  </span>
                </SkillLink>
              </div>
            )
          })}
        </div>
      ) : (
        <span className="text-slate-400 dark:text-slate-600">—</span>
      )}
    </td>
  )
}
