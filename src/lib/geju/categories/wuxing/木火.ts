import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 木火 类 — 木火通明 / 木火相煎 / 木多火塞 必互斥.
 *
 *  【岁运】岁运五行加量参与判定 (Trigger / Break / 转判).
 */
type Verdict = '木火通明' | '木火相煎' | '木多火塞'

interface Counts {
  ganHuo: number; zhiHuo: number
  ganMu: number; zhiMu: number
  ganShui: number; zhiShui: number
  ganJin: number
  rootExtMu: boolean
}

function readCounts(includeExtras: boolean): Counts {
  const bazi = readBazi()
  const extras = readExtras()
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  const baseRootExtMu = bazi.rootExt('木')
  return {
    ganHuo: bazi.ganWxCount('火') + eg('火'),
    zhiHuo: bazi.zhiMainWxCount('火') + ez('火'),
    ganMu: bazi.ganWxCount('木') + eg('木'),
    zhiMu: bazi.zhiMainWxCount('木') + ez('木'),
    ganShui: bazi.ganWxCount('水') + eg('水'),
    zhiShui: bazi.zhiMainWxCount('水') + ez('水'),
    ganJin: bazi.ganWxCount('金') + eg('金'),
    rootExtMu: baseRootExtMu || (includeExtras && ez('木') > 0),
  }
}

function judgeFromCounts(c: Counts, dayWx: string): { name: Verdict; note: string } | null {
  if (dayWx === '木') {
    const huoMany = c.ganHuo >= 2 || c.zhiHuo >= 2
    const muRootThin = c.zhiMu <= 1
    const noShui = c.ganShui === 0 && c.zhiShui === 0
    if (huoMany && muRootThin && noShui) {
      return { name: '木火相煎', note: '火过旺而木根虚，无水润' }
    }
    const shuiRooted = c.ganShui > 0 && c.zhiShui > 0
    if (
      !shuiRooted
      && c.ganHuo > 0 && c.zhiHuo > 0 && c.rootExtMu
      && c.ganJin < 2
    ) {
      return { name: '木火通明', note: '木生火，火透坐巳午本气根，无重金重水' }
    }
  }
  if (dayWx === '火') {
    if (c.zhiMu >= 3) {
      const huoWeak = c.zhiHuo === 0 || c.zhiHuo < 2
      const wuJin = c.ganJin === 0 || c.ganJin < 2
      if (huoWeak && wuJin) {
        return { name: '木多火塞', note: '木多压火 · 火弱无根 · 无金疏通' }
      }
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

export function isMuHuoTongMing(): GejuHit | null { return pick('木火通明') }
export function isMuHuoXiangJian(): GejuHit | null { return pick('木火相煎') }
export function isMuDuoHuoSai(): GejuHit | null { return pick('木多火塞') }
