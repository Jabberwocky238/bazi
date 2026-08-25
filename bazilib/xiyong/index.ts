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
import type { DetailedPillar, PillarShishenView } from '../base'
import type { StrengthAnalysis } from '../strength'
import type { GejuOutput } from '../geju'
import {
  catToWx,
  type Cat,
  type WuXing,
  type XiyongAnalysis,
  type GanZhiType,
} from './types'

export type { Cat, WuXing, XiyongAnalysis, GanZhiType }
import { analyzePillarsGanZhi } from './pillar'
import { analyzeJiuying } from './jiuying'
import { countWxStrength, analyzeTongguan } from './tongguan'
import { sideOf, pickFuYi, computeTiaohou } from './fuyi'

function pickCongOverride(gejuHits: GejuOutput[]): string | null {
  const congHit = gejuHits.find((h) => h.category === '从格')
  if (congHit) return `命中 ${congHit.name} → 日主已极弱顺从所从之神；扶抑结论需反向取用`
  const zhuanHit = gejuHits.find((h) => h.category === '专旺格')
  if (zhuanHit) return `命中 ${zhuanHit.name} → 一气成象，顺其旺势；忌官杀逆之`
  return null
}

/**
 * 喜用神分析纯函数。
 * @param pillars 4 柱
 * @param shishen 四柱十神视图 (与 pillars 同序)
 * @param strength 身强弱分析结果
 * @param gejuHits 格局命中列表（可选，用于从格/专旺格覆写）
 */
export function analyzeXiyong(
  pillars: DetailedPillar[],
  shishen: PillarShishenView[],
  strength: StrengthAnalysis | null,
  gejuHits?: GejuOutput[],
): XiyongAnalysis | null {
  if (pillars.length !== 4) return null
  if (!strength) return null
  const dayGanC = pillars[2].pillar.gan
  const dayGan = dayGanC.str
  const dayWx = dayGanC.wuxing.str as WuXing

  const level = strength.level
  const score = strength.score
  const side = sideOf(level)
  const monthZhi = pillars[1].pillar.zhi.str

  // ② 扶抑
  const fy = pickFuYi(shishen, side)
  const primaryWx = fy.primaryCat ? catToWx(dayWx, fy.primaryCat) : null
  const secondaryWx = fy.secondaryCat ? catToWx(dayWx, fy.secondaryCat) : null
  const avoidWx: WuXing[] = fy.avoidCats.map((c: Cat) => catToWx(dayWx, c))
  const sickNote = fy.sickCat
    ? `${fy.sickCat}${side === 'strong' ? '(同党过重)' : '(异党过重)'}`
    : '无明显病根'

  return {
    dayGan, dayWx, monthZhi,
    level, score, side,

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

    congOverride: gejuHits ? pickCongOverride(gejuHits) : null,
  }
}
