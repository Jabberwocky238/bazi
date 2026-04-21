import type { SkillCategory } from './skills'

export interface Pillar {
  label: string

  gan: string
  zhi: string
  shishen: string // 十神
  hideGans: string[] // 藏干
  hideShishen: string[] // 藏干十神
  
  nayin: string
  
  ganWuxing: string
  zhiWuxing: string
  shishenWuxing: string // 十神五行
  hideShishenWuxings: string[] // 藏干十神五行

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

/** 大运/流年挂进命盘计算的临时"柱" */
export interface ExtraPillar {
  label: '大运' | '流年'
  gan: string
  zhi: string
  shishen: string
  hideShishen: string[]
  gz: string
  desc?: string
}
