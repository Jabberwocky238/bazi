import { GanC, type Gan } from '@jabberwocky238/bazi-engine'
import { WUXING_TEXT } from '@@/css'
import { SkillLink, type SkillItem } from '@@/SkillLink'

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
            const ss = shishens[i] ?? ''
            const sWx = shishenWuxings[i] ?? ''
            // 点击藏干 → multiple 列出 [天干, 十神] 两条释义;
            // 十神为"日主"(无释义) 时退化为 single (仅天干)。
            const items: SkillItem[] = [
              { category: 'tiangan', name: g, subtitle: '藏干' },
              { category: 'shishen', name: ss, subtitle: '藏干' },
            ]
            return (
              <div key={i} className="flex items-center justify-center">
                <SkillLink items={items} listTitle={`${g}${ss}`} className="flex items-center gap-1.5 md:gap-2">
                  <span className={`font-bold ${WUXING_TEXT[GanC.from(g as Gan).wuxing.str] ?? ''}`}>{g}</span>
                  <span className={`text-[11px] md:text-xs ${WUXING_TEXT[sWx] ?? 'text-slate-500 dark:text-slate-400'}`}>
                    {ss}
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
