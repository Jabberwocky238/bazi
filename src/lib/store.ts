import type { SkillCategory } from './skills'
import type { Gan, Zhi, WuXing, Shishen } from '@jabberwocky238/bazi-engine'

export type PillarType = '年柱' | '月柱' | '日柱' | '时柱' | '大运' | '流年' | '流月' | '流日' | '流时'

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

export type BaziResult = {
  year: [Gan, Zhi]
  month: [Gan, Zhi]
  day: [Gan, Zhi]
  hour: [Gan, Zhi] | null
}

export interface SkillFocus {
  category: SkillCategory
  name: string
  subtitle?: string
}


