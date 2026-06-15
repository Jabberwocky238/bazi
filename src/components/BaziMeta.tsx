export function BaziMeta({
  solar,
  trueSolar,
  lunar,
}: {
  solar: string
  trueSolar: string
  lunar: string
}) {
  return (
    <div className="mb-5 flex flex-col md:flex-row md:flex-wrap md:items-baseline gap-1 md:gap-x-5 md:gap-y-1 text-[11px] md:text-xs text-slate-500 dark:text-slate-400">
      {solar && (
        <div>
          <b className="font-medium text-slate-700 dark:text-slate-300 mr-1.5">公历</b>
          <span className="tabular-nums">{solar}</span>
        </div>
      )}
      {trueSolar && (
        <div>
          <b className="font-medium text-slate-700 dark:text-slate-300 mr-1.5">真太阳时</b>
          <span className="tabular-nums">{trueSolar}</span>
        </div>
      )}
      {lunar && (
        <div>
          <b className="font-medium text-slate-700 dark:text-slate-300 mr-1.5">农历</b>
          {lunar}
        </div>
      )}
    </div>
  )
}
