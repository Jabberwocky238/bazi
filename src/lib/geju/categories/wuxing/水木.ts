import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 水木 类 — 水多木漂 / 水冷木寒 / 水木清华 必互斥, 单次裁断.
 *   水多木漂 (病, 木日主): 水过旺 + 木无根 + 无土火.
 *   水冷木寒 (病, 木日主冬月): 水多 + 无火 + 无土.
 *   水木清华 (好象, 水/木日主): 水木双透 + 比例合宜 + 无金 + 无重土 + 无火坐根.
 */
type Verdict = '水多木漂' | '水冷木寒' | '水木清华'

function judge(): { name: Verdict; note: string } | null {
  const bazi = readBazi()

  if (bazi.dayWx === '木') {
    const shuiMany = bazi.ganWxCount('水') >= 2 || bazi.zhiMainWxCount('水') >= 3
    if (
      shuiMany
      && bazi.zhiMainWxCount('木') === 0
      && !bazi.touWx('土') && !bazi.touWx('火')
    ) {
      return { name: '水多木漂', note: '水盛 · 木无根 · 无土制水无火泄木' }
    }
    if (
      bazi.season === '冬'
      && (bazi.ganWxCount('水') >= 2 || bazi.zhiMainWxCount('水') >= 2)
      && !bazi.touWx('火') && !bazi.touWx('土')
    ) {
      return { name: '水冷木寒', note: '冬月水旺 · 无火调候 · 无土制水' }
    }
  }

  if (bazi.dayWx === '水' || bazi.dayWx === '木') {
    if (
      bazi.touWx('水') && bazi.touWx('木')
      && !bazi.touWx('金')
      && bazi.zhiMainWxCount('土') < 2
      && !(bazi.touWx('火') && bazi.rootExt('火'))
    ) {
      const shuiN = bazi.ganWxCount('水') + bazi.zhiMainWxCount('水')
      const muN = bazi.ganWxCount('木') + bazi.zhiMainWxCount('木')
      if (muN > 0 && shuiN <= muN * 2) {
        return { name: '水木清华', note: '水生木且木透，水木比例合宜，无金克无重土塞水' }
      }
    }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const r = judge()
  return r?.name === target ? { name: r.name, note: r.note } : null
}

export function isShuiDuoMuPiao(): GejuHit | null { return pick('水多木漂') }
export function isShuiLengMuHan(): GejuHit | null { return pick('水冷木寒') }
export function isShuiMuQingHua(): GejuHit | null { return pick('水木清华') }
