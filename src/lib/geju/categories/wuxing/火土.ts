import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 火土 类 — 火土夹带 / 火炎土燥 必互斥, 单次裁断.
 *   夹带 (好象): 火土皆透有根 + 有水调湿.
 *   炎燥 (病): 火土皆透 + 火过旺 + 无水.
 */
type Verdict = '火土夹带' | '火炎土燥'

function judge(): { name: Verdict; note: string } | null {
  const bazi = readBazi()
  if (!bazi.touWx('火') || !bazi.touWx('土')) return null
  const huoHeavy = bazi.ganWxCount('火') >= 2 || bazi.zhiMainWxCount('火') >= 2
  const hasShui = bazi.touWx('水') || bazi.rootWx('水')
  // 炎燥: 火重无水
  if (huoHeavy && !hasShui) {
    return { name: '火炎土燥', note: '火旺透土而无水润' }
  }
  // 夹带: 火土有根 + 水润
  if (bazi.rootWx('火') && bazi.rootWx('土') && hasShui) {
    return { name: '火土夹带', note: '火土相连有根且水润' }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const r = judge()
  return r?.name === target ? { name: r.name, note: r.note } : null
}

export function isHuoTuJiaDai(): GejuHit | null { return pick('火土夹带') }
export function isHuoYanTuZao(): GejuHit | null { return pick('火炎土燥') }
