import { GejuContext, type GejuHit } from '../types'
import { emitGeju } from '../_emit'
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

function readCounts(ctx: GejuContext, includeExtras: boolean): Counts {
  const extras = ctx.extras
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  return {
    ganJin: ctx.ganWxCount('金') + eg('金'), zhiJin: ctx.zhiMainWxCount('金') + ez('金'),
    ganTu: ctx.ganWxCount('土') + eg('土'), zhiTu: ctx.zhiMainWxCount('土') + ez('土'),
    ganMu: ctx.ganWxCount('木') + eg('木'), zhiMu: ctx.zhiMainWxCount('木') + ez('木'),
    ganHuo: ctx.ganWxCount('火') + eg('火'),
    ganShui: ctx.ganWxCount('水') + eg('水'), zhiShui: ctx.zhiMainWxCount('水') + ez('水'),
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

export function isTuJinYuXiu(ctx: GejuContext): GejuHit | null { return pick(ctx, '土金毓秀') }
export function isTuZhongJinMai(ctx: GejuContext): GejuHit | null { return pick(ctx, '土重金埋') }
