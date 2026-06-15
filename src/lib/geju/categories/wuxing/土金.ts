import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 土金 类 — 土金毓秀 / 土重金埋 必互斥. 【岁运】岁运五行加量参与判定.
 */
type Verdict = '土金毓秀' | '土重金埋'

interface Counts {
  ganJin: number; zhiJin: number
  ganTu: number; zhiTu: number
  ganMu: number; zhiMu: number
  ganHuo: number
  ganShui: number; zhiShui: number
}

function readCounts(includeExtras: boolean): Counts {
  const bazi = readBazi()
  const extras = readExtras()
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  return {
    ganJin: bazi.ganWxCount('金') + eg('金'), zhiJin: bazi.zhiMainWxCount('金') + ez('金'),
    ganTu: bazi.ganWxCount('土') + eg('土'), zhiTu: bazi.zhiMainWxCount('土') + ez('土'),
    ganMu: bazi.ganWxCount('木') + eg('木'), zhiMu: bazi.zhiMainWxCount('木') + ez('木'),
    ganHuo: bazi.ganWxCount('火') + eg('火'),
    ganShui: bazi.ganWxCount('水') + eg('水'), zhiShui: bazi.zhiMainWxCount('水') + ez('水'),
  }
}

function judgeFromCounts(c: Counts, dayWx: string): { name: Verdict; note: string } | null {
  if (dayWx === '土') {
    if (c.ganJin > 0 && c.zhiJin > 0 && c.zhiTu > 0 && c.ganMu === 0 && c.ganHuo < 2) {
      return { name: '土金毓秀', note: '土厚金透通根，无木克土无重火克金' }
    }
  }
  if (dayWx === '金') {
    const tuHeavy = c.zhiTu >= 3 || c.ganTu >= 2
    if (
      tuHeavy && c.zhiJin === 0
      && !(c.ganMu > 0 && c.zhiMu > 0)
      && !(c.ganShui > 0 && c.zhiShui > 0)
    ) {
      return { name: '土重金埋', note: '土势压金 · 金虚无根 · 无有力木/水救' }
    }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()
  const baseV = judgeFromCounts(readCounts(false), bazi.dayWx)
  const extV = judgeFromCounts(readCounts(true), bazi.dayWx)
  const baseHit = baseV?.name === target
  const extHit = extV?.name === target
  if (!baseHit && !extHit) return null
  const note = (baseHit ? baseV : extV)!.note
  return emitGeju(
    { name: target, note },
    { baseFormed: baseHit, withExtrasFormed: extHit, hasExtras: extras.active },
  )
}

export function isTuJinYuXiu(): GejuHit | null { return pick('土金毓秀') }
export function isTuZhongJinMai(): GejuHit | null { return pick('土重金埋') }
