import { LU, YANG_REN, KUIGANG_DAY, type Ctx } from '../ctx'
import type { GejuHit } from '../types'

/** 通用"月令X格"工厂：月令主气为 target OR target 透干 + 月令地支藏。 */
function monthGeFormed(ctx: Ctx, target: string): boolean {
  const monthMain = ctx.pillars[1].hideShishen[0] ?? ''
  if (monthMain === target) return true
  const monthHide = ctx.pillars[1].hideShishen.includes(target)
  return ctx.tou(target) && monthHide
}

/**
 * 建禄格（依 md 四条）：
 *  1. 月支本气为日主之禄。
 *  2. 月令不被冲。
 *  3. 官/财/食伤之一透干且通根作为泄/克出口。
 *  4. 身不过旺。
 */
export function isJianLuGe(ctx: Ctx): GejuHit | null {
  if (ctx.monthZhi !== LU[ctx.dayGan]) return null
  if (ctx.monthZhiBeingChong) return null
  const officerRooted = ctx.touCat('官杀') && (ctx.zang('正官') || ctx.zang('七杀'))
  const caiRooted = ctx.touCat('财') && (ctx.zang('正财') || ctx.zang('偏财'))
  const shiShangRooted = ctx.touCat('食伤') && (ctx.zang('食神') || ctx.zang('伤官'))
  if (!officerRooted && !caiRooted && !shiShangRooted) return null
  if (ctx.countCat('比劫') + ctx.countCat('印') >= 6) return null
  return {
    name: '建禄格',
    note: `月令 ${ctx.monthZhi} 临日主 ${ctx.dayGan} 之禄，带官/财/食伤透根为用`,
  }
}

/**
 * 正官格（依《子平真诠·论正官》5 条）：
 */
export function isZhengGuanGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '正官')) return null
  if (!ctx.tou('正官')) return null
  if (!ctx.zang('正官')) return null
  if (ctx.tou('七杀')) return null
  if (ctx.tou('伤官') && ctx.adjacentTou('伤官', '正官') && !ctx.touCat('印')) return null
  if (ctx.shenRuo) return null
  return { name: '正官格', note: '月令正官透根，不混杀无伤紧贴，身可任' }
}

/**
 * 七杀格（依《子平真诠·论七杀》5 条）：
 */
export function isQiShaGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '七杀')) return null
  if (ctx.tou('正官')) return null
  const foodRooted = ctx.tou('食神') && ctx.zang('食神') &&
    ctx.adjacentTou('食神', '七杀')
  const yinRooted = ctx.touCat('印') && (ctx.zang('正印') || ctx.zang('偏印'))
  const renJiaSha = ctx.dayYang && ctx.pillars.some(
    (p, i) => i !== 2 && p.zhi === (YANG_REN[ctx.dayGan] ?? ''),
  )
  if (!foodRooted && !yinRooted && !renJiaSha) return null
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  return {
    name: '七杀格',
    note: foodRooted ? '月令七杀 + 食神紧贴制 (透根)' :
          yinRooted ? '月令七杀 + 印化 (透根)' : '月令七杀 + 阳刃敌杀',
  }
}

/**
 * 食神格（依《子平真诠·论食神》5 条必要）：
 */
export function isShiShenGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '食神')) return null
  if (!ctx.tou('食神')) return null
  if (!ctx.zang('食神')) return null
  if (ctx.tou('伤官')) return null
  if (ctx.level === '身极弱' || ctx.level === '近从弱') return null
  const xiaoDuoShi =
    ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')
  if (xiaoDuoShi) return null
  return { name: '食神格', note: '月令食神透根，不混伤，无枭夺食' }
}

/** 伤官格：月令伤官 + 伤官透根 + 无正官 + 不混食神 + 身非极弱。 */
export function isShangGuanGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '伤官')) return null
  if (!ctx.tou('伤官')) return null
  if (!ctx.zang('伤官')) return null
  if (ctx.tou('正官')) return null
  if (ctx.tou('食神')) return null
  if (ctx.shenRuo) return null
  return { name: '伤官格', note: '月令伤官透根，无官可见，不混食' }
}

/** 正财格（依 md 四条）。 */
export function isZhengCaiGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '正财')) return null
  if (!ctx.tou('正财')) return null
  if (!ctx.zang('正财')) return null
  if (ctx.shenRuo) return null
  const bijieAdjCai =
    ctx.adjacentTou('劫财', '正财') || ctx.adjacentTou('比肩', '正财')
  if (bijieAdjCai && !ctx.touCat('官杀')) return null
  return { name: '正财格', note: '月令正财透根，身可任，比劫紧贴有官杀制' }
}

/** 偏财格（依 md 四条；身强要求比正财宽松）。 */
export function isPianCaiGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '偏财')) return null
  if (!ctx.tou('偏财')) return null
  if (!ctx.zang('偏财')) return null
  const isExtremelyWeak = ctx.level === '身极弱' || ctx.level === '近从弱'
  if (isExtremelyWeak && ctx.countCat('比劫') + ctx.countCat('印') === 0) return null
  const bijieAdjCai =
    ctx.adjacentTou('劫财', '偏财') || ctx.adjacentTou('比肩', '偏财')
  if (bijieAdjCai && !ctx.touCat('食伤') && !ctx.touCat('官杀')) return null
  return { name: '偏财格', note: '月令偏财透根，身可担，比劫紧贴有食伤/官杀化' }
}

/** 正印格（依《子平真诠·论印绶》4 条）。 */
export function isZhengYinGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '正印')) return null
  if (!ctx.tou('正印')) return null
  if (!ctx.zang('正印')) return null
  const caiAdjYin =
    ctx.adjacentTou('正财', '正印') || ctx.adjacentTou('偏财', '正印')
  if (caiAdjYin && !ctx.touCat('比劫')) return null
  if (ctx.level === '身极旺' && !ctx.touCat('财') && !ctx.touCat('食伤')) return null
  return { name: '正印格', note: '月令正印透根，无紧贴财破印' }
}

/** 偏印格（依《子平真诠·论偏印》5 条）。 */
export function isPianYinGe(ctx: Ctx): GejuHit | null {
  if (!monthGeFormed(ctx, '偏印')) return null
  if (!ctx.tou('偏印')) return null
  if (!ctx.zang('偏印')) return null
  const xiao = ctx.tou('偏印') && ctx.adjacentTou('偏印', '食神') && !ctx.touCat('财')
  if (xiao) return null
  const ganCount = ctx.pillars.filter((p) => p.shishen === '偏印').length
  const mainCount = ctx.mainAt('偏印').length
  if (ganCount + mainCount > 2) return null
  if (ctx.level === '身极旺') return null
  return { name: '偏印格', note: '月令偏印透根，量不过重，食神有护' }
}

/** 阳刃格（依《子平真诠·论阳刃》5 条）。 */
export function isYangRenGe(ctx: Ctx): GejuHit | null {
  if (!ctx.dayYang) return null
  if (ctx.monthZhi !== YANG_REN[ctx.dayGan]) return null
  if (ctx.monthZhiBeingChong) return null
  if (!ctx.touCat('官杀')) return null
  const gwRooted =
    (ctx.tou('正官') && ctx.zang('正官')) ||
    (ctx.tou('七杀') && ctx.zang('七杀'))
  if (!gwRooted) return null
  if (ctx.tou('正官') && !ctx.tou('七杀') && ctx.tou('伤官') && !ctx.touCat('印')) return null
  return { name: '阳刃格', note: `月令 ${ctx.monthZhi} 阳刃，官杀透根制之` }
}

/** 魁罡格（依《三命通会·论魁罡》4 条）。 */
const KUIGANG_FORBIDDEN_WX: Record<string, string> = {
  庚辰: '火', 庚戌: '火', 壬辰: '火', 戊戌: '水',
}
export function isKuiGangGe(ctx: Ctx): GejuHit | null {
  if (!KUIGANG_DAY.has(ctx.dayGz)) return null
  if (!ctx.shenWang) return null
  const forbidden = KUIGANG_FORBIDDEN_WX[ctx.dayGz]
  if (forbidden && ctx.touWx(forbidden)) return null
  if (ctx.dayZhi === '辰' && ctx.pillars.some((p, i) => i !== 2 && p.zhi === '戌')) return null
  if (ctx.dayZhi === '戌' && ctx.pillars.some((p, i) => i !== 2 && p.zhi === '辰')) return null
  return { name: '魁罡格', note: `日柱 ${ctx.dayGz} 魁罡 · 身旺 · 无忌透无冲` }
}

/** 壬骑龙背（依 md 4 条）。 */
export function isRenQiLongBei(ctx: Ctx): GejuHit | null {
  if (ctx.dayGz !== '壬辰') return null
  const hasXu = ctx.pillars.some((p) => p.zhi === '戌')
  if (hasXu) return null
  const otherRen = [ctx.pillars[0], ctx.pillars[1], ctx.pillars[3]]
    .some((p) => p.gan === '壬')
  const otherChen = [ctx.pillars[0].zhi, ctx.pillars[1].zhi, ctx.pillars[3].zhi]
    .includes('辰')
  const hasJin = ctx.touWx('金') || ctx.rootWx('金')
  const hasMu = ctx.touWx('木')
  if (!otherRen && !otherChen && !hasJin && !hasMu) return null
  if (ctx.ganWxCount('火') >= 2) return null
  if (ctx.ganWxCount('土') >= 2) return null
  return {
    name: '壬骑龙背',
    note: `日柱壬辰${otherRen ? '+壬' : ''}${otherChen ? '+辰' : ''}${hasJin ? '+金生' : ''}${hasMu ? '+木泄' : ''}`,
  }
}
