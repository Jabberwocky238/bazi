import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'
import { ganWuxing, GENERATES, type WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 两气成象 — 实际判据 (md 顶层 `两气成象/成立条件.md` 通则版)：
 *  ① 命局只见两种五行 (天干 + 地支主气)。
 *  ② 两五行为相生关系 (非相克)。
 *  ③ 两者位数差距 ≤ 2 (势均)。
 *  注: md 在 `两气成象/<五行对>/<具体格名>/成立条件.md` 下另有 22 个子格
 *  (水火既济 / 水火相战 / 木火通明 / 寒木向阳 / 木火相煎 / 木多火塞 / 水多木漂 /
 *  水木清华 / 水冷木寒 / 木疏厚土 / 火炎土燥 / 火土夹带 / 火多金熔 / 火旺金衰 /
 *  金火铸印 / 金白水清 / 金寒水冷 / 土金毓秀 / 土重金埋 / 斧斤伐木 / 日照江河 /
 *  壬骑龙背), 由 categories/wuxing 与 teshu 各独立 detector 处理。
 */
export function isLiangQiChengXiang(): GejuHit | null {
  const bazi = readBazi()
  const wxSet = new Set<string>()
  for (const p of bazi.mainArr) {
    const gw = ganWuxing(p.gan)
    if (gw) wxSet.add(gw)
    const zw = ganWuxing((p.hideGans[0] ?? '') as never)
    if (zw) wxSet.add(zw)
  }
  if (wxSet.size !== 2) return null
  const [a, b] = [...wxSet]
  if (GENERATES[a as WuXing] !== b && GENERATES[b as WuXing] !== a) return null
  const aN = bazi.ganWxCount(a as WuXing) + bazi.zhiMainWxCount(a as WuXing)
  const bN = bazi.ganWxCount(b as WuXing) + bazi.zhiMainWxCount(b as WuXing)
  if (Math.abs(aN - bN) > 2) return null
  return { name: '两气成象', note: `只见 ${a}${b} 两五行且势均相生` }
}
