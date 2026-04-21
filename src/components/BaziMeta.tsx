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
    <div className="mb-5 flex flex-wrap gap-5 md:gap-7 text-sm text-slate-500 dark:text-slate-400">
      <div>
        <b className="font-medium text-slate-800 dark:text-slate-200 mr-2">公历</b>
        {solar}
      </div>
      {trueSolar && (
        <div>
          <b className="font-medium text-slate-800 dark:text-slate-200 mr-2">真太阳时</b>
          {trueSolar}
          <span className="ml-1 text-[10px] text-slate-400 dark:text-slate-600">
            (仅均时差修正)
          </span>
        </div>
      )}
      <div>
        <b className="font-medium text-slate-800 dark:text-slate-200 mr-2">农历</b>
        {lunar}
      </div>
    </div>
  )
}
