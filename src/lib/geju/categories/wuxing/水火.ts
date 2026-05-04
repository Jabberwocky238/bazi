import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 水火 类 — 水火既济 / 水火相战 / 日照江河 必互斥, 单次裁断.
 *  优先级: 日照江河 (丙日特例) > 水火既济 (有木通关) > 水火相战.
 *
 *  【岁运】
 *   - 主局 水火相战 + 岁运透木通关 → 转 水火既济 (Trigger 已济, Break 相战)
 *   - 主局 水火既济 + 岁运重金破木 → 转 水火相战 (Break 已济, Trigger 相战)
 */
type Verdict = '水火既济' | '水火相战' | '日照江河'

interface Counts {
  ganHuo: number; zhiHuo: number
  ganShui: number; zhiShui: number
  ganMu: number; ganJin: number; ganTu: number
}

function readCounts(includeExtras: boolean): Counts {
  const bazi = readBazi()
  const extras = readExtras()
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  return {
    ganHuo: bazi.ganWxCount('火') + eg('火'),
    zhiHuo: bazi.zhiMainWxCount('火') + ez('火'),
    ganShui: bazi.ganWxCount('水') + eg('水'),
    zhiShui: bazi.zhiMainWxCount('水') + ez('水'),
    ganMu: bazi.ganWxCount('木') + eg('木'),
    ganJin: bazi.ganWxCount('金') + eg('金'),
    ganTu: bazi.ganWxCount('土') + eg('土'),
  }
}

function judgeFromCounts(c: Counts, dayGan: string): { name: Verdict; note: string } | null {
  // 日照江河 (丙日 + 水透 + 火根 + 无厚土)
  if (dayGan === '丙' && c.ganShui > 0 && (c.zhiHuo > 0 || c.ganHuo > 1)) {
    const waterStrong = c.zhiShui >= 2 || c.ganShui >= 2
    if (waterStrong && c.ganTu < 2) {
      return { name: '日照江河', note: '丙火有根，水旺流通' }
    }
  }
  // 水火 双透有根 + 势均
  const shuiShow = c.ganShui > 0 && c.zhiShui > 0
  const huoShow = c.ganHuo > 0 && c.zhiHuo > 0
  if (!shuiShow || !huoShow) return null
  const shuiN = c.ganShui + c.zhiShui
  const huoN = c.ganHuo + c.zhiHuo
  if (Math.abs(shuiN - huoN) > 2) return null

  if (c.ganMu > 0 && c.ganJin < 2) {
    return { name: '水火既济', note: '水火有根势均 · 木通关 · 无重金破木' }
  }
  if (c.ganMu === 0 && c.ganTu === 0) {
    return { name: '水火相战', note: '水火有根势均 · 无木通关无土调和' }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()
  const baseV = judgeFromCounts(readCounts(false), bazi.dayGan)
  const extV = judgeFromCounts(readCounts(true), bazi.dayGan)
  const baseHit = baseV?.name === target
  const extHit = extV?.name === target
  if (!baseHit && !extHit) return null
  const note = (baseHit ? baseV : extV)!.note
  return emitGeju(
    { name: target, note },
    { baseFormed: baseHit, withExtrasFormed: extHit, hasExtras: extras.active },
  )
}

export function isShuiHuoJiJi(): GejuHit | null { return pick('水火既济') }
export function isShuiHuoXiangZhan(): GejuHit | null { return pick('水火相战') }
export function judgeRiZhao(): GejuHit | null { return pick('日照江河') }
