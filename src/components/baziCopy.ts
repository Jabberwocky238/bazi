import type { DetailedPillar, PillarShishenView } from 'bazilib'

export interface BaziCopyData {
  solar: string
  trueSolar: string
  lunar: string
  pillars: DetailedPillar[]
  shishen: PillarShishenView[]
}

const display = (value: string): string => value || '—'

const joinUnique = (values: string[]): string => {
  const unique = [...new Set(values.filter(Boolean))]
  return unique.length ? unique.join('、') : '—'
}

function hiddenStems(pillar: DetailedPillar, view: PillarShishenView | undefined): string {
  const values = pillar.pillar.zhi.canggan().map((gan, index) => {
    const shishen = view?.zhi[index]
    return shishen ? `${gan.str}(${shishen.str})` : gan.str
  })
  return values.length ? values.join('/') : '—'
}

/** Build a compact, plain-text version of the chart for chat and note apps. */
export function formatBaziCopyText({
  solar,
  trueSolar,
  lunar,
  pillars,
  shishen,
}: BaziCopyData): string {
  const metadata = [
    solar ? `公历：${solar}` : '',
    trueSolar ? `真太阳时：${trueSolar}` : '',
    lunar ? `农历：${lunar}` : '',
  ].filter(Boolean)

  const rows = [
    ['四柱', ...pillars.map((pillar) => pillar.pillar.pillarType)],
    ['十神', ...pillars.map((pillar, i) =>
      display(pillar.isRizhu ? '日主' : (shishen[i]?.gan?.str ?? '')))],
    ['干支', ...pillars.map((pillar) => display(`${pillar.pillar.gan.str}${pillar.pillar.zhi.str}`))],
    ['藏干', ...pillars.map((pillar, i) => hiddenStems(pillar, shishen[i]))],
    ['纳音', ...pillars.map((pillar) => display(pillar.pillar.nayinName()))],
    ['自坐', ...pillars.map((pillar) => display(pillar.changsheng))],
    ['神煞', ...pillars.map((pillar) => joinUnique(pillar.shensha))],
  ]

  return ['八字排盘', ...metadata, '', ...rows.map((row) => row.join('\t'))].join('\n')
}

const CONTROL_ONLY_LINE = [
  /^[▸▾▴]$/,
  /^点击(?:展开|收起)$/,
  /^\d+\s*项\s*·\s*点击(?:展开|收起)$/,
  /^点击具体格局查看释义$/,
]

export function normalizeAnalysisText(text: string): string {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !CONTROL_ONLY_LINE.some((pattern) => pattern.test(line)))
    .join('\n')
}

function readAnalysisText(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement
  clone.querySelectorAll('[data-copy-exclude], input, select, textarea').forEach((element) => element.remove())
  clone.querySelectorAll<HTMLElement>('[data-copy-collapsible]').forEach((element) => {
    element.hidden = false
  })
  clone.querySelectorAll<HTMLElement>('.hidden').forEach((element) => {
    element.classList.remove('hidden')
  })

  clone.setAttribute('aria-hidden', 'true')
  Object.assign(clone.style, {
    position: 'fixed',
    inset: '0 auto auto 0',
    width: `${root.getBoundingClientRect().width}px`,
    maxHeight: 'none',
    overflow: 'visible',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  })
  document.body.appendChild(clone)

  try {
    return normalizeAnalysisText(clone.innerText)
  } finally {
    clone.remove()
  }
}

export function formatBaziAnalysisCopyText(data: BaziCopyData, root: HTMLElement): string {
  const analysis = readAnalysisText(root)
  return analysis
    ? `${formatBaziCopyText(data)}\n\n全部分析\n${analysis}`
    : formatBaziCopyText(data)
}

/** Clipboard API with a fallback for older browsers and embedded WebViews. */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Some WebViews expose the Clipboard API but reject calls to it.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  textarea.style.pointerEvents = 'none'
  document.body.appendChild(textarea)
  textarea.select()
  textarea.setSelectionRange(0, text.length)

  try {
    if (!document.execCommand('copy')) throw new Error('Clipboard copy was rejected')
  } finally {
    textarea.remove()
  }
}
