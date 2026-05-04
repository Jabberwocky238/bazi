import { SkillLink } from '@@/SkillLink'

type ShenshaQuality = 'good' | 'bad'

/** 明确凶神 —— 只留真正伤灾/破格类（精简）。*/
const BAD_SHENSHA = new Set<string>([
  // 刃类 (真伤)
  '羊刃', '飞刃', '血刃',
  // 硬凶
  '白虎', '十恶大败', '童子煞', '勾绞煞',
  '亡神', '灾煞',
  // 丧葬 (硬凶)
  '丧门', '吊客',
  // 婚姻硬破
  '孤鸾煞',
])

/**
 * 神煞吉凶二分类：
 *  - 凶 (红)：刃/煞/丧葬/破格
 *  - 吉 (黄)：其他（原"中性"与"吉"合并）—— 贵人、驿马、桃花、魁罡、华盖等皆归此类
 */
function shenshaQuality(name: string): ShenshaQuality {
  if (BAD_SHENSHA.has(name)) return 'bad'
  return 'good'
}

const CHIP_CLS: Record<ShenshaQuality, string> = {
  good: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/40',
  bad: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
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
