/** 喜用神模块类型 + 共用映射。其他子模块共享之。 */
import {
  GENERATES as GEN,
  CONTROLS as CON,
  GENERATED_BY as GEN_BY,
  CONTROLLED_BY as CON_BY,
} from '@jabberwocky238/bazi-engine'

export type WuXing = '木' | '火' | '土' | '金' | '水'
export type Cat = '比劫' | '印' | '食伤' | '财' | '官杀'
export type Side = 'self' | 'other' | 'neutral'

export const CAT_OF_SHISHEN: Record<string, Cat> = {
  比肩: '比劫', 劫财: '比劫',
  正印: '印', 偏印: '印',
  食神: '食伤', 伤官: '食伤',
  正财: '财', 偏财: '财',
  正官: '官杀', 七杀: '官杀',
}

export function catToWx(dayWx: WuXing, cat: Cat): WuXing {
  switch (cat) {
    case '比劫': return dayWx
    case '印':   return GEN_BY[dayWx]
    case '食伤': return GEN[dayWx]
    case '财':   return CON[dayWx]
    case '官杀': return CON_BY[dayWx]
  }
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
