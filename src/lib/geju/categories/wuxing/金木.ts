import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/** 金木 类 — 斧斤伐木 (单格): 木日主 + 木有根 + 金透根适度 + 水/土不过多. */
export function isFuJinFaMu(): GejuHit | null {
  const bazi = readBazi()
  if (bazi.dayWx !== '木') return null
  if (!bazi.rootWx('木')) return null
  const jinGanN = bazi.ganWxCount('金')
  const jinZhiN = bazi.zhiMainWxCount('金')
  if (jinGanN === 0 && jinZhiN === 0) return null
  if (jinGanN + jinZhiN > 3) return null
  if (!bazi.touWx('金')) return null
  if (bazi.ganWxCount('水') + bazi.zhiMainWxCount('水') >= 3) return null
  if (bazi.ganWxCount('土') + bazi.zhiMainWxCount('土') >= 3) return null
  return { name: '斧斤伐木', note: '木有根 · 金透根适度 · 金木对立成象' }
}
