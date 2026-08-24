/** 通关分析（两强相战，依 通关.md）+ 五行力量统计。 */
import { WuXingC } from '@jabberwocky238/bazi-engine'
import type { DetailedPillar } from '../base'
import type { TongguanInfo, WuXing } from './types'

/**
 * 五行力量统计 (通关判断用)：
 *  - 四天干各 +1，月干 +0.5 (月令透干加重)
 *  - 四地支各 +2，月支 +1 (月令加重)；藏干本气已在其中
 */
export function countWxStrength(pillars: DetailedPillar[]): Record<WuXing, number> {
  const cnt: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  pillars.forEach((p, i) => {
    cnt[p.pillar.gan.wuxing.str] += i === 1 ? 1.5 : 1
  })
  pillars.forEach((p, i) => {
    cnt[p.pillar.zhi.wuxing.str] += i === 1 ? 3 : 2
  })
  return cnt
}

function findWxInPillars(pillars: DetailedPillar[], wx: WuXing): string[] {
  const hits: string[] = []
  pillars.forEach((p, i) => {
    const pos = ['年', '月', '日', '时'][i]
    if (p.pillar.gan.wuxing.str === wx) hits.push(`${pos}干 ${p.pillar.gan.str}`)
    if (p.pillar.zhi.wuxing.str === wx) hits.push(`${pos}支 ${p.pillar.zhi.str}`)
  })
  return hits
}

/** 判断两股力量"势均" —— 双方都达到阈值且比例不失衡。 */
export function analyzeTongguan(
  pillars: DetailedPillar[],
  wxCnt: Record<WuXing, number>,
): TongguanInfo {
  const THRESHOLD = 4        // 两方都需 ≥ 4 算旺
  const BALANCE = 0.5        // 弱/强 ≥ 0.5 算势均
  const pairs: Array<[WuXing, WuXing]> = [
    ['金', '木'], ['木', '土'], ['土', '水'], ['水', '火'], ['火', '金'],
  ]
  let best: { a: WuXing; b: WuXing; score: number } | null = null
  for (const [a, b] of pairs) {
    const va = wxCnt[a], vb = wxCnt[b]
    if (va < THRESHOLD || vb < THRESHOLD) continue
    const ratio = Math.min(va, vb) / Math.max(va, vb)
    if (ratio < BALANCE) continue
    const score = va + vb
    if (!best || score > best.score) best = { a, b, score }
  }
  if (!best) {
    return {
      active: false, a: null, b: null,
      bridgeWx: null, bridgePresent: false,
      bridgeNote: '', note: '命局无明显两强相战',
    }
  }
  // 通关.md: 桥梁 = 被克者之印 (生被克者)
  // 通关.md: 桥梁 = 被克者之印 (生被克者) —— 走 engine relationFrom
  const bridgeWx = WuXingC.from(best.b).relationFrom('生我').str
  const bridgeHits = findWxInPillars(pillars, bridgeWx)
  const bridgePresent = bridgeHits.length > 0
  return {
    active: true,
    a: best.a,
    b: best.b,
    bridgeWx,
    bridgePresent,
    bridgeNote: bridgePresent
      ? `桥梁${bridgeWx}在局：${bridgeHits.join('、')}`
      : `桥梁${bridgeWx}原局缺 —— ${best.a}${best.b}相战无解，等大运补${bridgeWx}`,
    note: `${best.a}克${best.b}，两强相战 → 需${bridgeWx}通关 (${best.a}→${bridgeWx}→${best.b})`,
  }
}
