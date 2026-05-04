import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 金木 类 — 斧斤伐木 (单格): 木日主 + 木有根 + 金透根适度 + 水/土不过多.
 *  【岁运】岁运透金 → Trigger; 岁运透重水 / 重土 → Break.
 */
function check(includeExtras: boolean): boolean {
  const bazi = readBazi()
  if (bazi.dayWx !== '木') return false
  if (!bazi.rootWx('木')) return false
  const extras = readExtras()
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  const jinGanN = bazi.ganWxCount('金') + eg('金')
  const jinZhiN = bazi.zhiMainWxCount('金') + ez('金')
  if (jinGanN === 0 && jinZhiN === 0) return false
  if (jinGanN + jinZhiN > 3) return false
  if (jinGanN === 0) return false  // 金透才成象
  const shuiN = bazi.ganWxCount('水') + bazi.zhiMainWxCount('水') + eg('水') + ez('水')
  const tuN = bazi.ganWxCount('土') + bazi.zhiMainWxCount('土') + eg('土') + ez('土')
  if (shuiN >= 3) return false
  if (tuN >= 3) return false
  return true
}

export function isFuJinFaMu(): GejuHit | null {
  const extras = readExtras()
  const baseHit = check(false)
  const extHit = check(true)
  if (!baseHit && !extHit) return null
  return emitGeju(
    { name: '斧斤伐木', note: '木有根 · 金透根适度 · 金木对立成象' },
    { baseFormed: baseHit, withExtrasFormed: extHit, hasExtras: extras.active },
  )
}
