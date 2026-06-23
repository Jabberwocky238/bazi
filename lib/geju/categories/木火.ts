import { GejuContext, type GejuHit } from '../types'
import { emitGeju } from '../_emit'
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

function readCounts(ctx: GejuContext, includeExtras: boolean): Counts {
  const extras = ctx.extras
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  const baseRootExtMu = ctx.rootExt('木')
  return {
    ganHuo: ctx.calc.ganWxCount('火') + eg('火'),
    zhiHuo: ctx.calc.zhiMainWxCount('火') + ez('火'),
    ganMu: ctx.calc.ganWxCount('木') + eg('木'),
    zhiMu: ctx.calc.zhiMainWxCount('木') + ez('木'),
    ganShui: ctx.calc.ganWxCount('水') + eg('水'),
    zhiShui: ctx.calc.zhiMainWxCount('水') + ez('水'),
    ganJin: ctx.calc.ganWxCount('金') + eg('金'),
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

function pick(ctx: GejuContext, target: Verdict): GejuHit | null {
  const extras = ctx.extras
  const baseV = judgeFromCounts(readCounts(ctx, false), ctx.dayWx)
  const extV = judgeFromCounts(readCounts(ctx, true), ctx.dayWx)
  const baseHit = baseV?.name === target
  const extHit = extV?.name === target
  if (!baseHit && !extHit) return null
  const note = (baseHit ? baseV : extV)!.note
  return emitGeju(
    { name: target, note },
    { baseFormed: baseHit, withExtrasFormed: extHit, hasExtras: extras.active },
  )
}

export function isMuHuoTongMing(ctx: GejuContext): GejuHit | null { return pick(ctx, '木火通明') }
export function isMuHuoXiangJian(ctx: GejuContext): GejuHit | null { return pick(ctx, '木火相煎') }
export function isMuDuoHuoSai(ctx: GejuContext): GejuHit | null { return pick(ctx, '木多火塞') }
