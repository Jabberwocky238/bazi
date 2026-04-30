import { readBazi, readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 食神制杀（依《子平真诠》6 条）：
 *  1. 月令本气七杀 OR 七杀透干通根。
 *  2. 食神透干通根。
 *  3. 食杀力量两停（差距不超过 1 倍：食神位数 ≥ 七杀 / 2 且 ≤ 2 倍）。
 *  4. 食神与七杀位置相邻（紧贴）。
 *  5. 无枭印紧贴克食神，除非有财护。
 *  6. 日主不极弱。
 */
export function isShiShenZhiSha(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const monthMainSha = bazi.pillars.month.hideShishen[0] === '七杀'
  const shaTouRoot = shishen.tou('七杀') && shishen.zang('七杀')
  if (!monthMainSha && !shaTouRoot) return null
  if (!shishen.tou('食神')) return null
  if (!shishen.zang('食神')) return null
  // md 条件 3: 两停
  const shiN = shishen.countOf('食神')
  const shaN = shishen.countOf('七杀')
  if (shaN === 0) return null
  if (shiN * 2 < shaN || shaN * 2 < shiN) return null
  // md 条件 4: 紧贴
  if (!shishen.adjacentTou('食神', '七杀')) return null
  // md 条件 5: 枭夺食
  if (shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')) return null
  // md 条件 6: 非极弱
  if (strength.level === '身极弱' || strength.level === '近从弱') return null
  return { name: '食神制杀', note: '食杀两停透根紧贴 · 无枭夺食 · 身可任' }
}
