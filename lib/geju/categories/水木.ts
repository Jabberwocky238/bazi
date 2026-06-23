import { GejuContext, type GejuHit } from '../types'
import { emitGeju } from '../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 水木 类 — 水多木漂 / 水冷木寒 / 水木清华 必互斥.
 *  【岁运】岁运五行加量参与判定 (Trigger / Break / 转判).
 */
type Verdict = '水多木漂' | '水冷木寒' | '水木清华'

interface Counts {
  ganShui: number; zhiShui: number
  ganMu: number; zhiMu: number
  ganHuo: number; zhiHuo: number
  ganTu: number; zhiTu: number
  ganJin: number
  rootExtHuo: boolean
}

function readCounts(ctx: GejuContext, includeExtras: boolean): Counts {
  const extras = ctx.extras
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  return {
    ganShui: ctx.calc.ganWxCount('水') + eg('水'), zhiShui: ctx.calc.zhiMainWxCount('水') + ez('水'),
    ganMu: ctx.calc.ganWxCount('木') + eg('木'), zhiMu: ctx.calc.zhiMainWxCount('木') + ez('木'),
    ganHuo: ctx.calc.ganWxCount('火') + eg('火'), zhiHuo: ctx.calc.zhiMainWxCount('火') + ez('火'),
    ganTu: ctx.calc.ganWxCount('土') + eg('土'), zhiTu: ctx.calc.zhiMainWxCount('土') + ez('土'),
    ganJin: ctx.calc.ganWxCount('金') + eg('金'),
    rootExtHuo: ctx.rootExt('火') || (includeExtras && ez('火') > 0),
  }
}

function judgeFromCounts(c: Counts, dayWx: string, season: string): { name: Verdict; note: string } | null {
  if (dayWx === '木') {
    const shuiMany = c.ganShui >= 2 || c.zhiShui >= 3
    if (shuiMany && c.zhiMu === 0 && c.ganTu === 0 && c.ganHuo === 0) {
      return { name: '水多木漂', note: '水盛 · 木无根 · 无土制水无火泄木' }
    }
    if (
      season === '冬'
      && (c.ganShui >= 2 || c.zhiShui >= 2)
      && c.ganHuo === 0 && c.ganTu === 0
    ) {
      return { name: '水冷木寒', note: '冬月水旺 · 无火调候 · 无土制水' }
    }
  }
  if (dayWx === '水' || dayWx === '木') {
    if (
      c.ganShui > 0 && c.ganMu > 0
      && c.ganJin === 0
      && c.zhiTu < 2
      && !(c.ganHuo > 0 && c.rootExtHuo)
    ) {
      const shuiN = c.ganShui + c.zhiShui
      const muN = c.ganMu + c.zhiMu
      if (muN > 0 && shuiN <= muN * 2) {
        return { name: '水木清华', note: '水生木且木透，水木比例合宜，无金克无重土塞水' }
      }
    }
  }
  return null
}

function pick(ctx: GejuContext, target: Verdict): GejuHit | null {
  const extras = ctx.extras
  const baseV = judgeFromCounts(readCounts(ctx, false), ctx.dayWx, ctx.season)
  const extV = judgeFromCounts(readCounts(ctx, true), ctx.dayWx, ctx.season)
  const baseHit = baseV?.name === target
  const extHit = extV?.name === target
  if (!baseHit && !extHit) return null
  const note = (baseHit ? baseV : extV)!.note
  return emitGeju(
    { name: target, note },
    { baseFormed: baseHit, withExtrasFormed: extHit, hasExtras: extras.active },
  )
}

export function isShuiDuoMuPiao(ctx: GejuContext): GejuHit | null { return pick(ctx, '水多木漂') }
export function isShuiLengMuHan(ctx: GejuContext): GejuHit | null { return pick(ctx, '水冷木寒') }
export function isShuiMuQingHua(ctx: GejuContext): GejuHit | null { return pick(ctx, '水木清华') }
