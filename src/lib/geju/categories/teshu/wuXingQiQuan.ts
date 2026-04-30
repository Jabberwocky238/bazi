import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'
import { ganWuxing } from '@jabberwocky238/bazi-engine'

/**
 * 五行齐全 —— md：「八字天干地支(含藏干)中木火土金水全部出现」。
 */
export function isWuXingQiQuan(): GejuHit | null {
  const bazi = readBazi()
  const wxSet = new Set<string>()
  for (const p of bazi.mainArr) {
    const gw = ganWuxing(p.gan)
    if (gw) wxSet.add(gw)
    for (const h of p.hideGans) {
      const hw = ganWuxing(h)
      if (hw) wxSet.add(hw)
    }
  }
  const WX = ['木', '火', '土', '金', '水']
  if (!WX.every((w) => wxSet.has(w))) return null
  return { name: '五行齐全', note: '木火土金水齐全' }
}
