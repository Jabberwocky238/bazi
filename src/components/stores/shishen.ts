import { create } from 'zustand'
import { computeBazi, type BaziResult } from '@/lib'
import { useBazi } from './bazi'

interface ShiShenState {
  result: BaziResult
}

function computeFromBazi(): BaziResult {
  const { year, month, day, hour, minute, sex } = useBazi.getState()
  return computeBazi(year, month, day, hour, minute, sex)
}

export const useShiShen = create<ShiShenState>(() => ({
  result: computeFromBazi(),
}))

// 订阅 useBazi 6 个输入字段变化 → 自动重算
useBazi.subscribe((s, prev) => {
  if (
    s.year === prev.year &&
    s.month === prev.month &&
    s.day === prev.day &&
    s.hour === prev.hour &&
    s.minute === prev.minute &&
    s.sex === prev.sex
  ) return
  useShiShen.setState({
    result: computeBazi(s.year, s.month, s.day, s.hour, s.minute, s.sex),
  })
})
