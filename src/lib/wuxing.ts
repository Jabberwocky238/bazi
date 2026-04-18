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

import { wuxingRelations, type Gan } from '@jabberwocky238/bazi-engine'

const SHISHEN_TO_REL: Record<string, '同类' | '我生' | '我克' | '克我' | '生我'> = {
  比肩: '同类', 劫财: '同类',
  食神: '我生', 伤官: '我生',
  偏财: '我克', 正财: '我克',
  七杀: '克我', 正官: '克我',
  偏印: '生我', 正印: '生我',
}

export function shishenWuxing(dayGan: string, shishen: string): string {
  const rel = SHISHEN_TO_REL[shishen]
  if (!rel) return ''
  try {
    return wuxingRelations(dayGan as Gan)[rel] ?? ''
  } catch {
    return ''
  }
}

const GAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
}

const ZHI_WUXING: Record<string, string> = {
  子: '水', 亥: '水',
  寅: '木', 卯: '木',
  巳: '火', 午: '火',
  申: '金', 酉: '金',
  辰: '土', 戌: '土', 丑: '土', 未: '土',
}

export function ganWuxing(gan: string): string {
  return GAN_WUXING[gan] ?? ''
}

export function zhiWuxing(zhi: string): string {
  return ZHI_WUXING[zhi] ?? ''
}

export function isInauspicious(name: string): boolean {
  return /煞|刃|空亡|孤辰|寡宿/.test(name)
}

export type ShenshaQuality = 'good' | 'bad' | 'neutral'

/**
 * 明确吉神（核心，非"贵人"类）。
 * 所有"X贵人"默认归中性（黄），不入本集合——贵人需实战看组合，不宜一律判吉。
 */
const GOOD_SHENSHA = new Set<string>([
  '学堂', '词馆', '正学堂', '正词馆',
  '禄神',
  '拱禄',
  '红鸾',
  '天喜',
  '将星',
  '天赦日',
])

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
 * 神煞吉凶分类：
 *  - 吉：核心贵神 (绿)
 *  - 凶：刃/煞/丧葬/破格 (红)
 *  - 中性：其他 (黄)  ——驿马、桃花、魁罡、华盖、金舆、德秀贵人、福星贵人、天医贵人、
 *    日德六秀日、十灵日、天罗地网 等都归中性
 */
export function shenshaQuality(name: string): ShenshaQuality {
  if (GOOD_SHENSHA.has(name)) return 'good'
  if (BAD_SHENSHA.has(name)) return 'bad'
  return 'neutral'
}
