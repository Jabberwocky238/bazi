/**
 * 喜用神分析 orchestrator —— 依据 喜用神.md 流程：
 *   ① 干支作用 (盖头/截脚/覆载) — pillar.ts
 *   ② 扶抑 (五大情况) — fuyi.ts
 *   ③ 救应 (病 → 药) — jiuying.ts
 *   ④ 调候硬约束 — fuyi.ts
 *   ⑤ 通关 (两强相战) — tongguan.ts
 *   ⑥ 从格 / 专旺格 覆写
 *
 * md 明文："扶抑与调候冲突时以扶抑为主 · 从格出现一切推翻"。
 * 本实现不含合冲刑害动态修正、细分病药法。
 */
import { create } from 'zustand'
import { ganWuxing } from '@jabberwocky238/bazi-engine'
import type { Pillar } from '../store'
import { useBazi } from '../shishen'
import { useStrength } from '../strength'
import { detectGeju } from '../geju'
import {
  catToWx,
  type Cat,
  type WuXing,
  type XiyongAnalysis,
} from './types'
import { analyzePillarsGanZhi } from './pillar'
import { analyzeJiuying } from './jiuying'
import { countWxStrength, analyzeTongguan } from './tongguan'
import { sideOf, pickFuYi, computeTiaohou } from './fuyi'

export * from './types'
export { analyzePillarsGanZhi } from './pillar'
export { analyzeJiuying } from './jiuying'
export { analyzeTongguan, countWxStrength } from './tongguan'
export { sideOf, pickFuYi, pickSickCat, computeTiaohou } from './fuyi'

function pickCongOverride(): string | null {
  const hits = detectGeju()
  const congHit = hits.find((h) => h.category === '从格')
  if (congHit) return `命中 ${congHit.name} → 日主已极弱顺从所从之神；扶抑结论需反向取用`
  const zhuanHit = hits.find((h) => h.category === '专旺格')
  if (zhuanHit) return `命中 ${zhuanHit.name} → 一气成象，顺其旺势；忌官杀逆之`
  return null
}

/**
 * @param pillars  4 柱
 * @param injectedStrength 可选 — 显式传入身强弱分析 (合盘多盘场景需要;
 *   不传则回 useStrength.getState().analysis 主路径行为).
 */
export function analyzeXiyong(
  pillars: Pillar[],
  injectedStrength?: import('../strength').StrengthAnalysis | null,
): XiyongAnalysis | null {
  if (pillars.length !== 4) return null
  const dayGan = pillars[2].gan
  const dayWx = ganWuxing(dayGan) as WuXing
  if (!dayWx) return null

  const strength = injectedStrength ?? useStrength.getState().analysis
  if (!strength) return null
  const level = strength.level
  const side = sideOf(level)
  const monthZhi = pillars[1].zhi

  // ② 扶抑
  const fy = pickFuYi(pillars, side)
  const primaryWx = fy.primaryCat ? catToWx(dayWx, fy.primaryCat) : null
  const secondaryWx = fy.secondaryCat ? catToWx(dayWx, fy.secondaryCat) : null
  const avoidWx: WuXing[] = fy.avoidCats.map((c: Cat) => catToWx(dayWx, c))
  const sickNote = fy.sickCat
    ? `${fy.sickCat}${side === 'strong' ? '(同党过重)' : '(异党过重)'}`
    : '无明显病根'

  return {
    dayGan, dayWx, monthZhi,
    level, side,

    ganZhi: analyzePillarsGanZhi(pillars),

    sickCat: fy.sickCat,
    sickNote,
    primaryCat: fy.primaryCat,
    primaryWx,
    secondaryCat: fy.secondaryCat,
    secondaryWx,
    avoidCats: fy.avoidCats,
    avoidWx,
    reason: fy.reason,

    jiuying: analyzeJiuying(pillars, dayWx, side, fy.sickCat),
    tiaohou: computeTiaohou(monthZhi, dayWx),
    tongguan: analyzeTongguan(pillars, countWxStrength(pillars)),

    // 注入 strength 时跳过 congOverride — pickCongOverride 走 detectGeju 会
    // 读 useBazi 全局, 与传入 pillars 不一致 (合盘多盘场景下会错). 主路径不传, 走全局正常.
    congOverride: injectedStrength ? null : pickCongOverride(),
  }
}

// ————————————————————————————————————————————————————————
// useXiyong — 自动跟随 useBazi.pillars 重算 analyzeXiyong
// ————————————————————————————————————————————————————————

interface XiyongStore {
  analysis: XiyongAnalysis | null
}

export const useXiyong = create<XiyongStore>()(() => ({
  analysis: analyzeXiyong(useBazi.getState().pillars),
}))

useBazi.subscribe((s, prev) => {
  if (s.pillars === prev.pillars) return
  useXiyong.setState({ analysis: analyzeXiyong(s.pillars) })
})
