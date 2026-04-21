/**
 * 喜用神分析 —— 严格依据以下 md：
 *   - bazi-skills/core/基础/喜用神/喜用神.md (总流程)
 *   - bazi-skills/core/基础/喜用神/扶抑.md (五大情况)
 *   - bazi-skills/core/基础/喜用神/寒暖燥湿.md (调候硬约束)
 *   - bazi-skills/core/基础/喜用神/通关.md (两强相战)
 *   - bazi-skills/core/基础/喜用神/救应.md (病 → 药 五方式)
 *   - bazi-skills/core/基础/干支作用/{盖头,截脚,覆载}.md (柱内干支作用)
 *
 * 依 md "扶抑与调候冲突时以扶抑为主 · 从格出现一切推翻"。
 * 本实现不含合冲刑害动态修正、细分病药法，md 亦说需人工综合再审。
 */

import type { Pillar } from './store'
import { ganWuxing, zhiWuxing } from '@jabberwocky238/bazi-engine'
import { analyzeStrength } from './strength'
import { detectGeju } from './geju'
import {
  GENERATES as GEN,
  CONTROLS as CON,
  GENERATED_BY as GEN_BY,
  CONTROLLED_BY as CON_BY,
} from '@jabberwocky238/bazi-engine'

export type WuXing = '木' | '火' | '土' | '金' | '水'
export type Cat = '比劫' | '印' | '食伤' | '财' | '官杀'
export type Side = 'self' | 'other' | 'neutral'

const CAT_OF_SHISHEN: Record<string, Cat> = {
  比肩: '比劫', 劫财: '比劫',
  正印: '印', 偏印: '印',
  食神: '食伤', 伤官: '食伤',
  正财: '财', 偏财: '财',
  正官: '官杀', 七杀: '官杀',
}

function catToWx(dayWx: WuXing, cat: Cat): WuXing {
  switch (cat) {
    case '比劫': return dayWx
    case '印':   return GEN_BY[dayWx]
    case '食伤': return GEN[dayWx]
    case '财':   return CON[dayWx]
    case '官杀': return CON_BY[dayWx]
  }
}

// ————————————————————————————————————————————————————————
// 干支作用（盖头/截脚/覆载）
// ————————————————————————————————————————————————————————

export type GanZhiType = '盖头' | '截脚' | '覆载(同气)' | '覆载(得载)' | '覆载(得覆)' | '中性'

export interface GanZhiInteraction {
  pos: '年' | '月' | '日' | '时'
  gan: string
  zhi: string
  ganWx: string
  zhiWx: string
  type: GanZhiType
  note: string
}

function analyzeGanZhi(p: Pillar, pos: GanZhiInteraction['pos']): GanZhiInteraction {
  const gw = ganWuxing(p.gan)
  const zw = zhiWuxing(p.zhi)
  const base = { pos, gan: p.gan, zhi: p.zhi, ganWx: gw, zhiWx: zw }
  if (!gw || !zw) return { ...base, type: '中性', note: '' }
  if (gw === zw) return { ...base, type: '覆载(同气)', note: '天地同气，力量集中' }
  if (GEN[gw as WuXing] === zw) return { ...base, type: '覆载(得覆)', note: '天干生地支，地支受生' }
  if (GEN[zw as WuXing] === gw) return { ...base, type: '覆载(得载)', note: '地支生天干，天干有根' }
  if (CON[gw as WuXing] === zw) return { ...base, type: '盖头', note: `${gw} 克 ${zw}，地支根基被压` }
  if (CON[zw as WuXing] === gw) return { ...base, type: '截脚', note: `${zw} 克 ${gw}，天干根基被反噬` }
  return { ...base, type: '中性', note: '' }
}

// ————————————————————————————————————————————————————————
// 五行力量统计 (通关判断用)
// ————————————————————————————————————————————————————————

function countWxStrength(pillars: Pillar[]): Record<WuXing, number> {
  const cnt: Record<WuXing, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  // 四天干各 +1，月干 +0.5 (月令透干加重)
  pillars.forEach((p, i) => {
    const w = ganWuxing(p.gan) as WuXing
    if (w) cnt[w] += i === 1 ? 1.5 : 1
  })
  // 四地支各 +2，月支 +1 (月令加重)；藏干本气已在其中
  pillars.forEach((p, i) => {
    const w = zhiWuxing(p.zhi) as WuXing
    if (w) cnt[w] += i === 1 ? 3 : 2
  })
  return cnt
}

// ————————————————————————————————————————————————————————
// 救应 (病 → 药 五方式)
// 依 救应.md
// ————————————————————————————————————————————————————————

export type JiuyingMethod = '通关' | '制约' | '合化' | '泄化' | '远离' | null

export interface JiuyingInfo {
  sickDesc: string           // 病象描述
  method: JiuyingMethod      // 首要救应方式
  medicineWx: WuXing | null  // 药五行
  medicinePresent: boolean   // 药是否存在于原局
  medicineNote: string       // 药的落点说明
  reason: string             // 救应原理文字
}

function findWxInPillars(pillars: Pillar[], wx: WuXing): string[] {
  const hits: string[] = []
  pillars.forEach((p, i) => {
    const pos = ['年', '月', '日', '时'][i]
    if (ganWuxing(p.gan) === wx) hits.push(`${pos}干 ${p.gan}`)
    if (zhiWuxing(p.zhi) === wx) hits.push(`${pos}支 ${p.zhi}`)
  })
  return hits
}

function analyzeJiuying(
  pillars: Pillar[],
  dayWx: WuXing,
  side: 'strong' | 'weak' | 'neutral',
  sickCat: Cat | null,
): JiuyingInfo {
  if (!sickCat) {
    return {
      sickDesc: '无明显病根',
      method: null,
      medicineWx: null,
      medicinePresent: false,
      medicineNote: '',
      reason: '命局相对平衡，无需特定救应',
    }
  }
  const sickWx = catToWx(dayWx, sickCat)
  // 按 救应.md "病 → 救应对照表" 与 "五种基本方式" 选最适合的一类
  let method: JiuyingMethod = null
  let medicineWx: WuXing | null = null
  let reason = ''
  let sickDesc = ''

  if (side === 'weak' && sickCat === '官杀') {
    // 身弱杀重 → 印化杀 (泄化) / 比劫分杀 / 食神制杀 / 伤官合杀
    sickDesc = `官杀(${sickWx})过旺克身`
    method = '泄化'
    medicineWx = GEN_BY[dayWx]
    reason = `印(${medicineWx})化杀生身 —— 杀印相生，化敌为友`
  } else if (side === 'weak' && sickCat === '财') {
    // 财多身弱 → 比劫帮身 / 印生身 (制约 / 泄化)
    sickDesc = `财星(${sickWx})过旺耗身`
    method = '制约'
    medicineWx = dayWx
    reason = `比劫(${medicineWx})帮身并克财 —— 一举两得`
  } else if (side === 'weak' && sickCat === '食伤') {
    // 枭神夺食的反面 —— 身弱食伤泄身 → 印克食伤
    sickDesc = `食伤(${sickWx})泄身过重`
    method = '制约'
    medicineWx = GEN_BY[dayWx]
    reason = `印(${medicineWx})克食伤并生身 —— 克泄两制`
  } else if (side === 'strong' && sickCat === '印') {
    // 身旺印多 → 财克印 (制约)
    sickDesc = `印枭(${sickWx})过旺助身`
    method = '制约'
    medicineWx = CON[dayWx]
    reason = `财(${medicineWx})克印切断源头`
  } else if (side === 'strong' && sickCat === '比劫') {
    // 身旺比劫重 → 食伤泄秀 (泄化)
    sickDesc = `比劫(${sickWx})过旺同党拥挤`
    method = '泄化'
    medicineWx = GEN[dayWx]
    reason = `食伤(${medicineWx})泄秀 —— 比劫旺喜泄不喜克`
  } else {
    sickDesc = `${sickCat}(${sickWx}) 过重`
    reason = '病根模糊，需合冲刑害再审'
  }

  // 检查药是否存在于原局（透干或有根）
  const medicineHits = medicineWx ? findWxInPillars(pillars, medicineWx) : []
  const medicinePresent = medicineHits.length > 0
  const medicineNote = medicineWx
    ? medicinePresent
      ? `药${medicineWx}在局：${medicineHits.join('、')}`
      : `药${medicineWx}原局缺 —— 需大运/流年引动 (md：有病 + 药引，等大运激活)`
    : ''

  return { sickDesc, method, medicineWx, medicinePresent, medicineNote, reason }
}

// ————————————————————————————————————————————————————————
// 通关 (两强相战)
// 依 通关.md
// ————————————————————————————————————————————————————————

export interface TongguanInfo {
  active: boolean            // 是否存在两强相战
  a: WuXing | null           // 冲克方
  b: WuXing | null           // 被克方
  bridgeWx: WuXing | null    // 通关五行
  bridgePresent: boolean     // 桥梁是否在局
  bridgeNote: string         // 桥梁落点
  note: string               // 原理
}

/** 判断两股力量"势均" —— 双方都达到阈值且比例不失衡 */
function analyzeTongguan(
  pillars: Pillar[],
  wxCnt: Record<WuXing, number>,
): TongguanInfo {
  const THRESHOLD = 4        // 两方都需 ≥ 4 算旺
  const BALANCE = 0.5        // 弱/强 ≥ 0.5 算势均 (通关.md "一强一弱 → 偏克，非战")
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
  const bridgeWx = GEN_BY[best.b]
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

// ————————————————————————————————————————————————————————
// 主分析
// ————————————————————————————————————————————————————————

export interface XiyongAnalysis {
  dayGan: string
  dayWx: WuXing
  monthZhi: string
  level: string
  side: 'strong' | 'weak' | 'neutral'

  /** 干支作用 (盖头/截脚/覆载) */
  ganZhi: GanZhiInteraction[]

  /** 扶抑 */
  sickCat: Cat | null
  sickNote: string
  primaryCat: Cat | null
  primaryWx: WuXing | null
  secondaryCat: Cat | null
  secondaryWx: WuXing | null
  avoidCats: Cat[]
  avoidWx: WuXing[]
  reason: string

  /** 救应 */
  jiuying: JiuyingInfo

  /** 调候硬约束 */
  tiaohou: {
    required: boolean
    wx: WuXing | null
    note: string
  }

  /** 通关 */
  tongguan: TongguanInfo

  /** 从格 / 专旺格 覆写提醒 */
  congOverride: string | null
}

/** 判定五大情况中"病根"最重的那一类 */
function pickSickCat(pillars: Pillar[], side: 'strong' | 'weak'): Cat | null {
  const cnt: Record<Cat, number> = { 比劫: 0, 印: 0, 食伤: 0, 财: 0, 官杀: 0 }
  const ganShens = [pillars[0].shishen, pillars[1].shishen, pillars[3].shishen]
  for (const s of ganShens) {
    const c = CAT_OF_SHISHEN[s]
    if (c) cnt[c] += 1
  }
  for (const p of pillars) {
    for (const s of p.hideShishen) {
      const c = CAT_OF_SHISHEN[s]
      if (c) cnt[c] += 1
    }
  }
  if (side === 'strong') {
    return cnt.印 >= cnt.比劫 ? '印' : '比劫'
  }
  const others: Cat[] = ['官杀', '食伤', '财']
  others.sort((a, b) => cnt[b] - cnt[a])
  return cnt[others[0]] > 0 ? others[0] : null
}

export function analyzeXiyong(pillars: Pillar[]): XiyongAnalysis | null {
  if (pillars.length !== 4) return null
  const dayGan = pillars[2].gan
  const dayWx = ganWuxing(dayGan) as WuXing
  if (!dayWx) return null

  const strength = analyzeStrength(pillars)
  if (!strength) return null
  const level = strength.level
  const strongLv = new Set(['身极旺', '身旺', '身中强', '身中(偏强)'])
  const weakLv = new Set(['身略弱', '身弱', '身极弱', '近从弱', '身中(偏弱)'])
  const side: 'strong' | 'weak' | 'neutral' = strongLv.has(level)
    ? 'strong' : weakLv.has(level) ? 'weak' : 'neutral'

  // 从格 / 专旺格 覆写
  const hits = detectGeju(pillars)
  const congHit = hits.find((h) => h.category === '从格')
  const zhuanHit = hits.find((h) => h.category === '专旺格')
  let congOverride: string | null = null
  if (congHit) {
    congOverride = `命中 ${congHit.name} → 日主已极弱顺从所从之神；扶抑结论需反向取用`
  } else if (zhuanHit) {
    congOverride = `命中 ${zhuanHit.name} → 一气成象，顺其旺势；忌官杀逆之`
  }

  // 扶抑五大情况
  let primaryCat: Cat | null = null
  let secondaryCat: Cat | null = null
  let avoidCats: Cat[] = []
  let sickCat: Cat | null = null
  let reason = ''

  if (side === 'strong') {
    sickCat = pickSickCat(pillars, 'strong')
    if (sickCat === '印') {
      primaryCat = '财'
      secondaryCat = '食伤'
      avoidCats = ['印', '比劫']
      reason = '身旺印多（情况四）→ 财克印切源头为首，食伤泄身为次；官杀生印生身禁用'
    } else {
      primaryCat = '食伤'
      secondaryCat = '官杀'
      avoidCats = ['比劫', '印']
      reason = '身旺比劫重（情况五）→ 比劫旺喜泄不喜克，食伤泄秀为首、官杀次之'
    }
  } else if (side === 'weak') {
    sickCat = pickSickCat(pillars, 'weak')
    if (sickCat === '官杀') {
      primaryCat = '印'
      secondaryCat = '比劫'
      avoidCats = ['官杀', '财']
      reason = '身弱官杀旺（情况一）→ 印化官杀生身为首；禁用食伤以免克泄交加'
    } else if (sickCat === '财') {
      primaryCat = '比劫'
      secondaryCat = '印'
      avoidCats = ['财', '官杀', '食伤']
      reason = '身弱财多（情况二）→ 比劫克财帮身为首，印次之（印易被财克）'
    } else {
      primaryCat = '印'
      secondaryCat = '比劫'
      avoidCats = ['食伤', '财', '官杀']
      reason = '身弱食伤泄身（情况三）→ 印克食伤并生身一举两得'
    }
  } else {
    reason = '身中和 / 临界 → 扶抑法结论模糊，需结合调候、大运流年具体定夺'
  }

  const primaryWx = primaryCat ? catToWx(dayWx, primaryCat) : null
  const secondaryWx = secondaryCat ? catToWx(dayWx, secondaryCat) : null
  const avoidWx = avoidCats.map((c) => catToWx(dayWx, c))

  // 救应
  const jiuying = analyzeJiuying(pillars, dayWx, side, sickCat)

  // 调候硬约束
  const monthZhi = pillars[1].zhi
  let tiaohou: XiyongAnalysis['tiaohou']
  if (['亥', '子', '丑'].includes(monthZhi) && dayWx !== '火') {
    tiaohou = { required: true, wx: '火', note: `${monthZhi}月至寒，硬约束需火暖局` }
  } else if (['巳', '午', '未'].includes(monthZhi) && dayWx !== '水') {
    tiaohou = { required: true, wx: '水', note: `${monthZhi}月至暖，硬约束需水润局` }
  } else {
    tiaohou = { required: false, wx: null, note: '月令非至寒至暖，调候非硬约束' }
  }

  // 通关
  const wxCnt = countWxStrength(pillars)
  const tongguan = analyzeTongguan(pillars, wxCnt)

  // 干支作用
  const ganZhi: GanZhiInteraction[] = [
    analyzeGanZhi(pillars[0], '年'),
    analyzeGanZhi(pillars[1], '月'),
    analyzeGanZhi(pillars[2], '日'),
    analyzeGanZhi(pillars[3], '时'),
  ]

  const sickNote = sickCat
    ? `${sickCat}${side === 'strong' ? '(同党过重)' : '(异党过重)'}`
    : '无明显病根'

  return {
    dayGan, dayWx, monthZhi,
    level, side,
    ganZhi,
    sickCat, sickNote,
    primaryCat, primaryWx,
    secondaryCat, secondaryWx,
    avoidCats, avoidWx,
    reason,
    jiuying,
    tiaohou,
    tongguan,
    congOverride,
  }
}
