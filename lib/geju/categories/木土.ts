import { GejuContext, type GejuHit } from '../types'
import { emitGeju } from '../_emit'
import type { WuXing } from '@jabberwocky238/bazi-engine'

/**
 * 木土 类 — 木疏厚土 (单格): 土日主 + 土厚 + 木透有根能疏 + 无重金克木.
 *  【岁运】岁运透木 → Trigger; 岁运透重金 → Break.
 */
function check(ctx: GejuContext, includeExtras: boolean): boolean {
  if (ctx.dayWx !== '土') return false
  const extras = ctx.extras
  const eg = (wx: WuXing) => includeExtras ? extras.extraGanWxCount(wx) : 0
  const ez = (wx: WuXing) => includeExtras ? extras.extraZhiMainWxCount(wx) : 0
  const ganMu = ctx.ganWxCount('木') + eg('木')
  const zhiTu = ctx.zhiMainWxCount('土') + ez('土')
  const ganTu = ctx.ganWxCount('土') + eg('土')
  const ganJin = ctx.ganWxCount('金') + eg('金')
  const rootExtMu = ctx.rootExt('木') || (includeExtras && ez('木') > 0)
  if (zhiTu < 2) return false
  if (ganTu < 1) return false
  if (ganMu === 0) return false
  if (!rootExtMu) return false
  if (ganMu > 2) return false
  if (ganJin >= 2) return false
  return true
}

export function isMuShuHouTu(ctx: GejuContext): GejuHit | null {
  const extras = ctx.extras
  const baseHit = check(ctx, false)
  const extHit = check(ctx, true)
  if (!baseHit && !extHit) return null
  return emitGeju(
    { name: '木疏厚土', note: '土厚 · 木透有根疏土 · 无重金克木' },
    { baseFormed: baseHit, withExtrasFormed: extHit, hasExtras: extras.active },
  )
}
