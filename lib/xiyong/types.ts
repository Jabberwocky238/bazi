/** 喜用神模块类型 + 共用映射。其他子模块共享之。 */
import { ShishenC, ShishenCC, WuXingC } from '@jabberwocky238/bazi-engine'
import type { WuXing, ShishenCat } from '@jabberwocky238/bazi-engine'
export type { WuXing }
/** 十神类别 —— 直接复用 engine 的 ShishenCat。 */
export type Cat = ShishenCat
export type Side = 'self' | 'other' | 'neutral'

/** 十神 → 类别; 由 engine 的 ShishenC.catMap 派生, 不再自维表。 */
export const CAT_OF_SHISHEN: Record<string, Cat> = { ...ShishenC.catMap }

/**
 * 日主五行 + 十神类别 → 该类别的五行。
 * 由 engine 的 类别→relation (ShishenCC.relation) 与
 * WuXingC.relationFrom(relation) 组合得出, 不再自维四张生克表。
 */
export function catToWx(dayWx: WuXing, cat: Cat): WuXing {
  return WuXingC.from(dayWx).relationFrom(ShishenCC.from(cat).relation).str
}

// —— 干支作用 (盖头/截脚/覆载) ——

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

// —— 救应 ——

export type JiuyingMethod = '通关' | '制约' | '合化' | '泄化' | '远离' | null

export interface JiuyingInfo {
  sickDesc: string           // 病象描述
  method: JiuyingMethod      // 首要救应方式
  medicineWx: WuXing | null  // 药五行
  medicinePresent: boolean   // 药是否存在于原局
  medicineNote: string       // 药的落点说明
  reason: string             // 救应原理文字
}

// —— 通关 ——

export interface TongguanInfo {
  active: boolean            // 是否存在两强相战
  a: WuXing | null           // 冲克方
  b: WuXing | null           // 被克方
  bridgeWx: WuXing | null    // 通关五行
  bridgePresent: boolean     // 桥梁是否在局
  bridgeNote: string         // 桥梁落点
  note: string               // 原理
}

// —— 主分析 ——

export interface XiyongAnalysis {
  dayGan: string
  dayWx: WuXing
  monthZhi: string
  level: string
  /** 旺衰量化总分 (与 StrengthAnalysis.score 同源), 供 UI 显示数字。 */
  score: number
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
