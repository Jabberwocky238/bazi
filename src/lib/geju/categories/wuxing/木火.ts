import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 木火 类 — 木火通明 / 木火相煎 / 木多火塞 必互斥, 单次裁断.
 * 优先级:
 *   - 木日主: 火过旺木根虚 → 木火相煎; 否则 火透+根+木根 + 无水 → 木火通明.
 *   - 火日主: 木≥3 + 火弱 + 无金疏 → 木多火塞.
 */
type Verdict = '木火通明' | '木火相煎' | '木多火塞'

function judge(): { name: Verdict; note: string } | null {
  const bazi = readBazi()
  if (bazi.dayWx === '木') {
    const huoMany = bazi.ganWxCount('火') >= 2 || bazi.zhiMainWxCount('火') >= 2
    const muRootThin = bazi.zhiMainWxCount('木') <= 1
    const noShui = !bazi.touWx('水') && !bazi.rootWx('水')
    if (huoMany && muRootThin && noShui) {
      return { name: '木火相煎', note: '火过旺而木根虚，无水润' }
    }
    const shuiRooted = bazi.touWx('水') && bazi.rootWx('水')
    if (
      !shuiRooted
      && bazi.touWx('火') && bazi.rootWx('火') && bazi.rootExt('木')
      && bazi.ganWxCount('金') < 2
    ) {
      return { name: '木火通明', note: '木生火，火透坐巳午本气根，无重金重水' }
    }
  }
  if (bazi.dayWx === '火') {
    if (bazi.zhiMainWxCount('木') >= 3) {
      const huoWeak = !bazi.rootWx('火') || bazi.zhiMainWxCount('火') < 2
      const wuJin = !bazi.touWx('金') || bazi.ganWxCount('金') < 2
      if (huoWeak && wuJin) {
        return { name: '木多火塞', note: '木多压火 · 火弱无根 · 无金疏通' }
      }
    }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const r = judge()
  return r?.name === target ? { name: r.name, note: r.note } : null
}

export function isMuHuoTongMing(): GejuHit | null { return pick('木火通明') }
export function isMuHuoXiangJian(): GejuHit | null { return pick('木火相煎') }
export function isMuDuoHuoSai(): GejuHit | null { return pick('木多火塞') }
