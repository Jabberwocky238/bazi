/** 格局判定用 — 身强弱快照. */
import { useStrength as useStrengthStore } from '../../strength'
import type { StrengthAnalysis, StrengthLevel } from '../../strength'

export interface StrengthSnapshot {
  strength: StrengthAnalysis | null
  level: StrengthLevel | ''
  deLing: boolean
  deDi: boolean
  deShi: boolean
  shenWang: boolean
  shenRuo: boolean
}

export function readStrength(): StrengthSnapshot {
  const s = useStrengthStore.getState()
  return {
    strength: s.analysis,
    level: s.level,
    deLing: s.deLing,
    deDi: s.deDi,
    deShi: s.deShi,
    shenWang: s.shenWang,
    shenRuo: s.shenRuo,
  }
}
