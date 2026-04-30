import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 火金 类 — 火多金熔 / 火旺金衰 / 金火铸印 必互斥, 单次裁断.
 *   优先 (越严重越先):
 *     ① 金虚 + 火盛 + 无水土救 → 火多金熔.
 *     ② 金有根 + 火透坐根不过旺 → 金火铸印 (好象).
 *     ③ 金无根 + 火透 ≥ 2 + 无土通关 → 火旺金衰 (中等).
 */
type Verdict = '火多金熔' | '火旺金衰' | '金火铸印'

function judge(): { name: Verdict; note: string } | null {
  const bazi = readBazi()
  if (bazi.dayWx !== '金') return null

  const huoHeavyEither = bazi.ganWxCount('火') >= 2 || bazi.zhiMainWxCount('火') >= 2
  const jinRooted = bazi.rootWx('金')
  const ganJinFew = bazi.ganWxCount('金') < 2
  const shuiRooted = bazi.touWx('水') && bazi.rootWx('水')
  const tuRooted = bazi.touWx('土') && bazi.rootWx('土')

  // ① 火多金熔: 金无根 + 火盛 + 金透不多 + 无水/土救
  if (huoHeavyEither && !jinRooted && ganJinFew && !shuiRooted && !tuRooted) {
    return { name: '火多金熔', note: '火盛金虚 · 无有力水/土救' }
  }
  // ② 金火铸印: 金有根 + 火透坐根 + 火不过旺 (透 < 3)
  if (
    jinRooted
    && bazi.touWx('火') && bazi.rootWx('火')
    && bazi.ganWxCount('火') < 3
  ) {
    return { name: '金火铸印', note: '金有根 · 火透坐根不过旺 · 得火锻炼' }
  }
  // ③ 火旺金衰: 火透 ≥ 2 + 金无根 + 无土通关
  if (bazi.ganWxCount('火') >= 2 && !jinRooted && !bazi.touWx('土')) {
    return { name: '火旺金衰', note: '火多透 · 金无根 · 无土通关' }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const r = judge()
  return r?.name === target ? { name: r.name, note: r.note } : null
}

export function isHuoDuoJinRong(): GejuHit | null { return pick('火多金熔') }
export function isHuoWangJinShuai(): GejuHit | null { return pick('火旺金衰') }
export function isJinHuoZhuYin(): GejuHit | null { return pick('金火铸印') }
