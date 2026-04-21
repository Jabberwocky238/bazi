export const inputCls =
  'w-16 md:w-24 px-2 md:px-3 py-2 text-sm md:text-base rounded-md border border-slate-300 bg-white ' +
  'text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 ' +
  'focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600 transition'

export const labelCls =
  'flex flex-col gap-1.5 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400'

export const primaryBtn =
  'px-6 py-2 rounded-md bg-amber-700 hover:bg-amber-600 text-white font-medium transition shadow-sm'

export const cellBase =
  'py-2 md:py-2.5 px-1.5 md:px-2 text-xs md:text-sm text-slate-800 dark:text-slate-200 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800'

export const thBase =
  'w-12 md:w-20 py-2 md:py-2.5 px-1.5 md:px-3 text-[11px] md:text-xs font-medium tracking-wider text-slate-500 dark:text-slate-400 text-right bg-slate-50 dark:bg-slate-950/60 border-b border-r border-slate-200 dark:border-slate-800'

export const cardCls =
  'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm'

// —— 五行 → Tailwind 色类 ——
export const WUXING_TEXT: Record<string, string> = {
  木: 'text-wood',
  火: 'text-fire',
  土: 'text-earth',
  金: 'text-metal',
  水: 'text-water',
}

export const WUXING_BORDER: Record<string, string> = {
  木: 'border-wood/60',
  火: 'border-fire/60',
  土: 'border-earth/60',
  金: 'border-metal/60',
  水: 'border-water/60',
}

export const WUXING_FROM: Record<string, string> = {
  木: 'from-wood/15',
  火: 'from-fire/15',
  土: 'from-earth/15',
  金: 'from-metal/15',
  水: 'from-water/15',
}

export const WUXING_BG_SOFT: Record<string, string> = {
  木: 'bg-wood/10',
  火: 'bg-fire/10',
  土: 'bg-earth/10',
  金: 'bg-metal/10',
  水: 'bg-water/10',
}

export const WUXING_BG_STRONG: Record<string, string> = {
  木: 'bg-wood',
  火: 'bg-fire',
  土: 'bg-earth',
  金: 'bg-metal',
  水: 'bg-water',
}
