import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/** 木土 类 — 木疏厚土 (单格): 土日主 + 土厚 + 木透有根能疏 + 无重金克木. */
export function isMuShuHouTu(): GejuHit | null {
  const bazi = readBazi()
  if (bazi.dayWx !== '土') return null
  if (bazi.zhiMainWxCount('土') < 2) return null
  if (bazi.ganWxCount('土') < 1) return null
  if (!bazi.touWx('木')) return null
  if (!bazi.rootExt('木')) return null
  if (bazi.ganWxCount('木') > 2) return null
  if (bazi.ganWxCount('金') >= 2) return null
  return { name: '木疏厚土', note: '土厚 · 木透有根疏土 · 无重金克木' }
}
