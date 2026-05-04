import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 金水 类 — 金寒水冷 / 金白水清 必互斥. 【岁运】岁运五行加量参与判定.
 */
type Verdict = '金寒水冷' | '金白水清'

interface Counts {
  ganJin: number; zhiJin: number
  ganShui: number; zhiShui: number
  ganHuo: number; ganTu: number
}

function readCounts(includeExtras: boolean): Counts {
  const bazi = readBazi()
  const extras = readExtras()
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  return {
    ganJin: bazi.ganWxCount('金') + eg('金'), zhiJin: bazi.zhiMainWxCount('金') + ez('金'),
    ganShui: bazi.ganWxCount('水') + eg('水'), zhiShui: bazi.zhiMainWxCount('水') + ez('水'),
    ganHuo: bazi.ganWxCount('火') + eg('火'),
    ganTu: bazi.ganWxCount('土') + eg('土'),
  }
}

function judgeFromCounts(c: Counts, dayWx: string, season: string, monthZhi: string): { name: Verdict; note: string } | null {
  if (
    dayWx === '金'
    && (season === '秋' || season === '冬')
    && c.ganShui > 0 && c.zhiShui > 0
    && c.zhiJin > 0
    && c.ganTu === 0 && c.ganHuo === 0
  ) {
    const monthIsShenYou = monthZhi === '申' || monthZhi === '酉'
    return {
      name: '金白水清',
      note: `${season}月金水并秀${monthIsShenYou ? '，月令秋金当令' : ''}`,
    }
  }
  if (
    season === '冬'
    && (dayWx === '金' || dayWx === '水')
    && c.ganJin > 0 && c.ganShui > 0
    && c.ganHuo === 0
  ) {
    return { name: '金寒水冷', note: '冬月金水并透，火缺调候' }
  }
  return null
}

function pick(target: Verdict): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()
  const baseV = judgeFromCounts(readCounts(false), bazi.dayWx, bazi.season, bazi.monthZhi)
  const extV = judgeFromCounts(readCounts(true), bazi.dayWx, bazi.season, bazi.monthZhi)
  const baseHit = baseV?.name === target
  const extHit = extV?.name === target
  if (!baseHit && !extHit) return null
  const note = (baseHit ? baseV : extV)!.note
  return emitGeju(
    { name: target, note },
    { baseFormed: baseHit, withExtrasFormed: extHit, hasExtras: extras.active },
  )
}

export function isJinHanShuiLeng(): GejuHit | null { return pick('金寒水冷') }
export function isJinBaiShuiQing(): GejuHit | null { return pick('金白水清') }
