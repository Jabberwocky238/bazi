import { GejuContext, CHONG_PAIR, LU, YANG_REN, type GejuHit } from '../types'
import { emitGeju } from '../_emit'
import type { Gan } from '@jabberwocky238/bazi-engine'

/**
 * 建禄格 — md 全部 4 条 + 岁运:
 *  ① 月支本气为日主之禄。
 *  ② 月令不被冲 (主局 / 岁运冲均破)。
 *  ③ 官 / 财 / 食伤 之一透干且通根 (主局 OR 岁运补)。
 *  ④ 身不过旺。
 *
 * 【岁运】md 明文 "建禄格最怕月令逢冲——大运流年冲月令则格局力破"。
 *   - 大运 / 流年 含月令地支之冲 (CHONG_PAIR[monthZhi]) → 主局成格也被破 (suiyunBreak)。
 *   - 主局缺 出口 (官 / 财 / 食伤) 时, 岁运补出口可激活成格 (suiyunTrigger)。
 */
export function isJianLuGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.calc.shishen()
  const extras = ctx.extras
  if (ctx.monthZhi !== LU[ctx.dayGan as Gan]) return null

  const baseChong = ctx.monthZhiBeingChong
  const extrasChong = extras.extraArr.some((p) => CHONG_PAIR[ctx.monthZhi] === p.zhi.name)

  const officerRooted = ctx.touCat('官杀') && (ss.zang('正官')[0] || ss.zang('七杀')[0])
  const caiRooted = ctx.touCat('财') && (ss.zang('正财')[0] || ss.zang('偏财')[0])
  const shiShangRooted = ctx.touCat('食伤') && (ss.zang('食神')[0] || ss.zang('伤官')[0])
  const baseHasOut = officerRooted || caiRooted || shiShangRooted

  const extrasOfficer = extras.touCat('官杀') && (ss.has('正官')[0] || ss.has('七杀')[0])
  const extrasCai = extras.touCat('财') && (ss.has('正财')[0] || ss.has('偏财')[0])
  const extrasShang = extras.touCat('食伤') && (ss.has('食神')[0] || ss.has('伤官')[0])
  const withExtrasOut = baseHasOut || extrasOfficer || extrasCai || extrasShang

  const overstrong = ss.countCat('比劫') + ss.countCat('印') >= 6

  const baseFormed = !baseChong && baseHasOut && !overstrong
  const withExtrasFormed = !baseChong && !extrasChong && withExtrasOut && !overstrong

  return emitGeju(
    { name: '建禄格', note: `月令 ${ctx.monthZhi} 临日主 ${ctx.dayGan} 之禄，带官/财/食伤透根为用` },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

/**
 * 阳刃格 — md 全部铁律 + 岁运:
 *  ① 月支 === 日干刃位。
 *  ② 必有官杀制刃 (主局 OR 岁运透官杀)。
 *  ③ 伤官紧贴正官且无印 → 破 (主局 / 岁运皆判)。
 */
export function isYangRenGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.calc.shishen()
  const extras = ctx.extras
  if (ctx.monthZhi !== YANG_REN[ctx.dayGan as Gan]) return null

  const baseGuanSha = ctx.touCat('官杀')
  const extrasGuanSha = baseGuanSha || extras.touCat('官杀')

  const breakBy = (touOrExtras: '正官' | '七杀' | '伤官', extrasFlag: boolean) =>
    ss.tou(touOrExtras)[0] || (extrasFlag && extras.tou(touOrExtras))
  const breakBase =
    ss.tou('正官')[0] && !ss.tou('七杀')[0] && ss.tou('伤官')[0] && !ctx.touCat('印')
  const breakWithExtras =
    breakBy('正官', true) && !breakBy('七杀', true) && breakBy('伤官', true)
    && !(ctx.touCat('印') || extras.touCat('印'))

  const baseFormed = baseGuanSha && !breakBase
  const withExtrasFormed = extrasGuanSha && !breakWithExtras

  const gwRooted =
    (ss.tou('正官')[0] && ss.zang('正官')[0]) ||
    (ss.tou('七杀')[0] && ss.zang('七杀')[0])
  const parts: string[] = [`月令 ${ctx.monthZhi} ${ctx.dayYang ? '阳刃' : '阴刃'}`]
  if (gwRooted) parts.push('官杀透根制之')
  else if (baseGuanSha) parts.push('官杀透而未通根')
  else parts.push('官杀须岁运补')
  if (ctx.monthZhiBeingChong) parts.push('月令被冲')

  return emitGeju(
    { name: '阳刃格', note: parts.join('，') },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
