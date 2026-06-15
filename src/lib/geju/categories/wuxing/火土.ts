import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 火土 类 — 火土夹带 / 火炎土燥 必互斥. 【岁运】岁运五行加量参与.
 */
type Verdict = '火土夹带' | '火炎土燥'

interface Counts {
  ganHuo: number; zhiHuo: number
  ganTu: number; zhiTu: number
  ganShui: number; zhiShui: number
}

function readCounts(includeExtras: boolean): Counts {
  const bazi = readBazi()
  const extras = readExtras()
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  return {
    ganHuo: bazi.ganWxCount('火') + eg('火'), zhiHuo: bazi.zhiMainWxCount('火') + ez('火'),
    ganTu: bazi.ganWxCount('土') + eg('土'), zhiTu: bazi.zhiMainWxCount('土') + ez('土'),
    ganShui: bazi.ganWxCount('水') + eg('水'), zhiShui: bazi.zhiMainWxCount('水') + ez('水'),
  }
}

function judgeFromCounts(c: Counts): { name: Verdict; note: string } | null {
  if (c.ganHuo === 0 || c.ganTu === 0) return null
  const huoHeavy = c.ganHuo >= 2 || c.zhiHuo >= 2
  const hasShui = c.ganShui > 0 || c.zhiShui > 0
  if (huoHeavy && !hasShui) {
    return { name: '火炎土燥', note: '火旺透土而无水润' }
  }
  if (c.zhiHuo > 0 && c.zhiTu > 0 && hasShui) {
    return { name: '火土夹带', note: '火土相连有根且水润' }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const extras = readExtras()
  const baseV = judgeFromCounts(readCounts(false))
  const extV = judgeFromCounts(readCounts(true))
  const baseHit = baseV?.name === target
  const extHit = extV?.name === target
  if (!baseHit && !extHit) return null
  const note = (baseHit ? baseV : extV)!.note
  return emitGeju(
    { name: target, note },
    { baseFormed: baseHit, withExtrasFormed: extHit, hasExtras: extras.active },
  )
}

export function isHuoTuJiaDai(): GejuHit | null { return pick('火土夹带') }
export function isHuoYanTuZao(): GejuHit | null { return pick('火炎土燥') }
