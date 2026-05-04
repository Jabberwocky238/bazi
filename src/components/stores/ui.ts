import { create } from 'zustand'
import type { Gan, Zhi, Shishen } from '@jabberwocky238/bazi-engine'
import type { SkillFocus } from '@/lib'
import { useBaziInput } from './bazi'

/** 大运/流年/流月叠加柱 —— UI 层临时数据，不含纳音/神煞等派生字段。 */
export interface ExtraPillar {
  label: '大运' | '流年' | '流月'
  gan: Gan
  zhi: Zhi
  shishen: Shishen
  hideShishen: Shishen[]
  /** 干支字符串，如 "甲子"。 */
  gz: string
  /** 显示描述，如 "2024 · 40 岁"。 */
  desc?: string
}

interface UiState {
  focused: SkillFocus | null
  extraPillars: ExtraPillar[]
  setFocused: (f: SkillFocus | null) => void
  setExtraPillars: (p: ExtraPillar[]) => void
}

export const useBaziStore = create<UiState>((set) => ({
  focused: null,
  extraPillars: [],
  setFocused: (f) => set({ focused: f }),
  setExtraPillars: (p) => set({ extraPillars: p }),
}))

// 输入变化 → 清空大运/流年叠加
useBaziInput.subscribe((s, prev) => {
  if (
    s.year === prev.year &&
    s.month === prev.month &&
    s.day === prev.day &&
    s.hour === prev.hour &&
    s.minute === prev.minute &&
    s.sex === prev.sex
  ) return
  useBaziStore.setState({ extraPillars: [] })
})
