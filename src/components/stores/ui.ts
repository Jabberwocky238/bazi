import { create } from 'zustand'
import type { SkillFocus, ExtraPillar } from '@/lib'
import { useBazi } from './bazi'

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
useBazi.subscribe((s, prev) => {
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
