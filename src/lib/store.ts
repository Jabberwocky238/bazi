import type { SkillCategory } from './skills'
import type { Gan, Zhi, WuXing, Shishen } from '@jabberwocky238/bazi-engine'

export type PillarType = '年柱' | '月柱' | '日柱' | '时柱' | '大运' | '流年'

export interface Pillar {
  label: PillarType

  gan: Gan
  zhi: Zhi
  shishen: Shishen // 十神
  hideGans: Gan[] // 藏干
  hideShishen: Shishen[] // 藏干十神
  
  nayin: string
  
  ganWuxing: WuXing
  zhiWuxing: WuXing
  shishenWuxing: WuXing // 十神五行
  hideShishenWuxings: WuXing[] // 藏干十神五行

  shensha: string[]
  zizuo: string
}

export interface BaziResult {
  solarStr: string
  /** 真太阳时（仅均时差修正；时辰未知时为空串）。 */
  trueSolarStr: string
  lunarStr: string
  pillars: Pillar[]
  hourKnown: boolean
}

export interface SkillFocus {
  category: SkillCategory
  name: string
  subtitle?: string
}


