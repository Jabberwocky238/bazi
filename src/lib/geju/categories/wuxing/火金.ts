import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 火金 类 — 火多金熔 / 火旺金衰 / 金火铸印 必互斥. 【岁运】岁运五行加量参与判定.
 */
type Verdict = '火多金熔' | '火旺金衰' | '金火铸印'

interface Counts {
  ganJin: number; zhiJin: number
  ganHuo: number; zhiHuo: number
  ganShui: number; zhiShui: number
  ganTu: number; zhiTu: number
}

function readCounts(includeExtras: boolean): Counts {
  const bazi = readBazi()
  const extras = readExtras()
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  return {
    ganJin: bazi.ganWxCount('金') + eg('金'), zhiJin: bazi.zhiMainWxCount('金') + ez('金'),
    ganHuo: bazi.ganWxCount('火') + eg('火'), zhiHuo: bazi.zhiMainWxCount('火') + ez('火'),
    ganShui: bazi.ganWxCount('水') + eg('水'), zhiShui: bazi.zhiMainWxCount('水') + ez('水'),
    ganTu: bazi.ganWxCount('土') + eg('土'), zhiTu: bazi.zhiMainWxCount('土') + ez('土'),
  }
}

function judgeFromCounts(c: Counts, dayWx: string): { name: Verdict; note: string } | null {
  if (dayWx !== '金') return null
  const huoHeavyEither = c.ganHuo >= 2 || c.zhiHuo >= 2
  const jinRooted = c.zhiJin > 0
  const ganJinFew = c.ganJin < 2
  const shuiRooted = c.ganShui > 0 && c.zhiShui > 0
  const tuRooted = c.ganTu > 0 && c.zhiTu > 0

  if (huoHeavyEither && !jinRooted && ganJinFew && !shuiRooted && !tuRooted) {
    return { name: '火多金熔', note: '火盛金虚 · 无有力水/土救' }
  }
  if (jinRooted && c.ganHuo > 0 && c.zhiHuo > 0 && c.ganHuo < 3) {
    return { name: '金火铸印', note: '金有根 · 火透坐根不过旺 · 得火锻炼' }
  }
  if (c.ganHuo >= 2 && !jinRooted && c.ganTu === 0) {
    return { name: '火旺金衰', note: '火多透 · 金无根 · 无土通关' }
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

export function isHuoDuoJinRong(): GejuHit | null { return pick('火多金熔') }
export function isHuoWangJinShuai(): GejuHit | null { return pick('火旺金衰') }
export function isJinHuoZhuYin(): GejuHit | null { return pick('金火铸印') }
