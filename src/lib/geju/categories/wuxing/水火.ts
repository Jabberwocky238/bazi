import { readBazi } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 水火 类 — 水火既济 / 水火相战 / 日照江河 必互斥, 单次裁断.
 * 优先级: 日照江河 (丙日特例) > 水火既济 (有木通关) > 水火相战 (无通关无调和).
 */
type Verdict = '水火既济' | '水火相战' | '日照江河'

function judge(): { name: Verdict; note: string } | null {
  const bazi = readBazi()
  // 日照江河 (丙日 + 水旺 + 火根 + 无厚土)
  if (bazi.dayGan === '丙' && bazi.touWx('水') && bazi.rootExt('火')) {
    const waterStrong = bazi.zhiMainWxCount('水') >= 2 || bazi.ganWxCount('水') >= 2
    if (waterStrong && bazi.ganWxCount('土') < 2) {
      return { name: '日照江河', note: '丙火有根 (含寅中丙)，水旺流通' }
    }
  }
  // 水火 双透有根 + 势均 — 既济 / 相战 共同前置
  const shuiShow = bazi.touWx('水') && bazi.rootWx('水')
  const huoShow = bazi.touWx('火') && bazi.rootWx('火')
  if (!shuiShow || !huoShow) return null
  const shuiN = bazi.ganWxCount('水') + bazi.zhiMainWxCount('水')
  const huoN = bazi.ganWxCount('火') + bazi.zhiMainWxCount('火')
  if (Math.abs(shuiN - huoN) > 2) return null

  if (bazi.touWx('木') && bazi.ganWxCount('金') < 2) {
    return { name: '水火既济', note: '水火有根势均 · 木通关 · 无重金破木' }
  }
  if (!bazi.touWx('木') && !bazi.touWx('土')) {
    return { name: '水火相战', note: '水火有根势均 · 无木通关无土调和' }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const r = judge()
  return r?.name === target ? { name: r.name, note: r.note } : null
}

export function isShuiHuoJiJi(): GejuHit | null { return pick('水火既济') }
export function isShuiHuoXiangZhan(): GejuHit | null { return pick('水火相战') }
export function judgeRiZhao(): GejuHit | null { return pick('日照江河') }
