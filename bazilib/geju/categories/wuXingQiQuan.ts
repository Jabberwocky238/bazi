// @ts-nocheck — 孤立文件: 依赖 commit 8ff72ee 删除的 ../snapshot 全局读取 API,
//   未接入 geju/index.ts 的 DETECTORS 表 (无任何引用)。待改写为 GejuContext 后再启用。
import { readBazi } from '../snapshot'
import type { GejuHit } from '../types'
import { ganWuxing } from '@jabberwocky238/bazi-engine'

/**
 * 五行齐全 —— md：「八字天干地支(含藏干)中木火土金水全部出现」。
 */
export function isWuXingQiQuan(): GejuHit | null {
  const bazi = readBazi()
  const wxSet = new Set<string>()
  for (const p of bazi.mainArr) {
    const gw = p.gan.wuxing
    if (gw) wxSet.add(gw)
    for (const h of p.zhi.cangGan) {
      const hw = h.wuxing
      if (hw) wxSet.add(hw)
    }
  }
  const WX = ['木', '火', '土', '金', '水']
  if (!WX.every((w) => wxSet.has(w))) return null
  return { name: '五行齐全', note: '木火土金水齐全' }
}
