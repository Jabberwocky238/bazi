import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 土金 类 — 土金毓秀 / 土重金埋 必互斥, 单次裁断.
 *   毓秀: 土日主 + 金透通根 + 土根 + 无木 + 火 < 2.
 *   金埋: 金日主 + 土势压金 + 金虚 + 无有力木 / 水救.
 */
type Verdict = '土金毓秀' | '土重金埋'

function judge(): { name: Verdict; note: string } | null {
  const bazi = readBazi()
  if (bazi.dayWx === '土') {
    if (
      bazi.touWx('金') && bazi.rootWx('金')
      && bazi.rootWx('土')
      && !bazi.touWx('木')
      && bazi.ganWxCount('火') < 2
    ) {
      return { name: '土金毓秀', note: '土厚金透通根，无木克土无重火克金' }
    }
  }
  if (bazi.dayWx === '金') {
    const tuHeavy = bazi.zhiMainWxCount('土') >= 3 || bazi.ganWxCount('土') >= 2
    if (
      tuHeavy
      && !bazi.rootWx('金')
      && !(bazi.touWx('木') && bazi.rootWx('木'))
      && !(bazi.touWx('水') && bazi.rootWx('水'))
    ) {
      return { name: '土重金埋', note: '土势压金 · 金虚无根 · 无有力木/水救' }
    }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const r = judge()
  return r?.name === target ? { name: r.name, note: r.note } : null
}

export function isTuJinYuXiu(): GejuHit | null { return pick('土金毓秀') }
export function isTuZhongJinMai(): GejuHit | null { return pick('土重金埋') }
