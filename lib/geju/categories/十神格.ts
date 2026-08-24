import { GejuContext, YANG_REN, type GejuHit } from '../types'
import { emitGeju } from '../_emit'
import type { Gan, Shishen } from '@jabberwocky238/bazi-engine'

/** 正格通用钩子：月支若是日主的阳刃/阴刃位 → 所有正格让位给阳刃格。 */
function deferToYangRen(ctx: GejuContext): boolean {
  return ctx.monthZhi === YANG_REN[ctx.dayGan as Gan]
}

/**
 * 通用"月令X格"工厂 — 双路径入格 (与 md《子平真诠》一致)：
 *  - 月支若同时是阳刃位 → 归阳刃格独占, 所有正格不成立。
 *  - 路径 1: 月令**本气**为 target。
 *  - 路径 2: 月令中气 / 余气藏 target, 且 target **透干**。
 */
function monthGeFormed(ctx: GejuContext, target: Shishen): boolean {
  if (deferToYangRen(ctx)) return false
  const ss = ctx.ss
  const monthHide = ctx.monthHideShishen
  if ((monthHide[0] as Shishen | undefined) === target) return true
  if (monthHide.includes(target) && ss.tou(target)[0]) return true
  return false
}

/**
 * 正官格 — 月令正官，身能任，不混杀无伤克。
 *
 * bazi-skills 5+1 条:
 *  1. 月令本气正官 OR 月令藏正官 + 透干        [静态: 月令固定]
 *  2. 不混七杀                                    [岁运透七杀 → Break]
 *  3. 无伤官紧贴克正官 (除非有印)               [岁运透伤官无印救 → Break]
 *  4. 日主非极弱 (能任官)                       [静态]
 *  5. 官星有根 (月支本气近似覆盖)
 *  6. (升格) 财生官 / 印护官 → 转 财官印全
 */
function isZhengGuanGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const strength = ctx.strength
  const extras = ctx.extras

  if (!monthGeFormed(ctx, '正官')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const baseClean2 = !ss.tou('七杀')[0]
  const baseClean3 = !(ss.tou('伤官')[0] && ss.adjacentTou('伤官', '正官') && !ctx.touCat('印'))
  const baseFormed = baseClean2 && baseClean3

  const extClean2 = baseClean2 && !extras.tou('七杀')
  const extClean3 = baseClean3 && !(extras.tou('伤官') && !ctx.touCat('印') && !extras.touCat('印'))
  const withExtrasFormed = extClean2 && extClean3

  return emitGeju(
    { name: '正官格', note: '月令正官 (本气或透根)，不混杀无伤紧贴，身可任' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

/** 天干五合：甲己/乙庚/丙辛/丁壬/戊癸。 */
const HE_GAN: Record<Gan, Gan> = {
  甲: '己', 乙: '庚', 丙: '辛', 丁: '壬', 戊: '癸',
  己: '甲', 庚: '乙', 辛: '丙', 壬: '丁', 癸: '戊',
}

/** 日主正官天干。 */
const ZHENG_GUAN: Record<Gan, Gan> = {
  甲: '辛', 乙: '庚', 丙: '癸', 丁: '壬', 戊: '乙',
  己: '甲', 庚: '丁', 辛: '丙', 壬: '己', 癸: '戊',
}

/** 正官透干且被日干合去 (阴日: 乙庚/丁壬/己甲/辛丙/癸戊)。 */
function zhengGuanHeQu(ctx: GejuContext): boolean {
  const heTarget = HE_GAN[ctx.dayGan as Gan]
  const guanGan = ZHENG_GUAN[ctx.dayGan as Gan]
  if (heTarget !== guanGan) return false
  return ctx.pillars[1].pillar.gan.str === guanGan || ctx.pillars[3].pillar.gan.str === guanGan
}

/**
 * 七杀格 — md 全部铁律 + 岁运:
 *  ① 月令本气七杀 / 月令藏 + 七杀透 (monthGeFormed 双路径)。
 *  ② 正官透且未被日干合去 → 破 (主局 / 岁运皆判)。
 *  ③ 必有制 (食神) 或化 (印星) — 主局 OR 岁运补。
 *  ④ 身非极弱 / 近从弱 (极弱归从杀)。
 */
function isQiShaGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const strength = ctx.strength
  const extras = ctx.extras
  if (!monthGeFormed(ctx, '七杀')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const heQu = zhengGuanHeQu(ctx)
  const baseGuanBlock = ss.tou('正官')[0] && !heQu
  const extrasGuanBlock = baseGuanBlock || (extras.tou('正官') && !heQu)

  const baseHasZhi = ss.has('食神')[0]
  const baseHasHua = ctx.hasCat('印')
  const baseControl = baseHasZhi || baseHasHua
  const withExtrasControl = baseControl || extras.has('食神') || extras.hasCat('印')

  const baseFormed = !baseGuanBlock && baseControl
  const withExtrasFormed = !extrasGuanBlock && withExtrasControl

  const foodControl = ss.tou('食神')[0] && ss.zang('食神')[0] && ss.adjacentTou('食神', '七杀')
  const yinHua = ctx.touCat('印') && (ss.zang('正印')[0] || ss.zang('偏印')[0])
  const renDiSha = ctx.dayYang && ctx.mainArr.some(
    (p, i) => i !== 2 && p.pillar.zhi.str === (YANG_REN[ctx.dayGan as Gan] ?? ''),
  )
  const details: string[] = []
  if (heQu) details.push('合官留杀')
  if (foodControl) details.push('食神制')
  else if (baseHasZhi) details.push('食神制 (透/藏)')
  else if (extras.has('食神')) details.push('岁运补食神')
  if (yinHua) details.push('印化')
  else if (baseHasHua) details.push('印化 (透/藏)')
  else if (extras.hasCat('印')) details.push('岁运补印')
  if (renDiSha) details.push('阳刃敌')

  return emitGeju(
    { name: '七杀格', note: `月令七杀 · ${details.join(' / ')}` },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

/**
 * 食神格 — 月令食神，身有根，无枭夺食。
 *
 * bazi-skills 5+1 条:
 *  1. 月令本气食神 OR 月令藏 + 透干              [静态]
 *  2. 食神透干通根                                [由 monthGeFormed 近似]
 *  3. 日主有根, 不极弱                            [静态]
 *  4. 无偏印紧贴夺食 (除非财护)                  [岁运透偏印且无财救 → Break]
 *  5. 食神清而不杂                                [由 isShiShangHunZa 独立判]
 *  6. (升格) 财星接应 → 转 食神生财
 */
function isShiShenYueLingGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const strength = ctx.strength
  const extras = ctx.extras

  if (!monthGeFormed(ctx, '食神')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const xiaoDuoShi =
    ss.tou('偏印')[0] && ss.adjacentTou('偏印', '食神') && !ctx.touCat('财')
  const baseFormed = !xiaoDuoShi

  const extXiaoDuoShi = xiaoDuoShi || (
    extras.tou('偏印') && !ctx.touCat('财') && !extras.touCat('财')
  )
  const withExtrasFormed = !extXiaoDuoShi

  return emitGeju(
    { name: '食神格', note: '月令食神 (本气或透根)，无枭夺食' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

/**
 * 伤官格 — 月令伤官，身有根，无官见无食混。
 *
 * bazi-skills 5 条:
 *  1. 月令本气伤官 OR 月令藏 + 透干              [静态]
 *  2. 伤官透干通根                                [由 monthGeFormed 近似]
 *  3. 无正官 (伤官见官为祸)                       [岁运透正官 → Break, 金水伤官喜见官未实现]
 *  4. 身伤配比决定取用                            [静态/由 strength]
 *  5. 伤官清而不杂                                [岁运透食神 → 混杂 Break]
 */
function isShangGuanGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const strength = ctx.strength
  const extras = ctx.extras

  if (!monthGeFormed(ctx, '伤官')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const baseClean3 = !ss.tou('正官')[0]
  const baseClean5 = !ss.tou('食神')[0]
  const baseFormed = baseClean3 && baseClean5

  const extClean3 = baseClean3 && !extras.tou('正官')
  const extClean5 = baseClean5 && !extras.tou('食神')
  const withExtrasFormed = extClean3 && extClean5

  return emitGeju(
    { name: '伤官格', note: '月令伤官 (本气或透根)，无官可见，不混食' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

/**
 * 正财格 — 月令正财，身可任，无比劫夺财。
 *
 * bazi-skills 5+1 条:
 *  1. 月令本气正财 OR 月令藏 + 透干              [静态]
 *  2. 财喜藏 / 透财须有官杀护卫
 *  3. 日主身强能任财                              [静态]
 *  4. 无比劫紧贴夺财 (除非官杀制)                [岁运透比劫无官杀救 → Break]
 *  5. 身弱通关 (本 detector 不处理)
 *  6. (升格) 财生官 / 食伤生财
 */
function isZhengCaiGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const strength = ctx.strength
  const extras = ctx.extras

  if (!monthGeFormed(ctx, '正财')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const bijieAdjCai =
    ss.adjacentTou('劫财', '正财') || ss.adjacentTou('比肩', '正财')
  const baseClean = !(bijieAdjCai && !ctx.touCat('官杀'))
  const baseFormed = baseClean

  const extClean = baseClean && !(
    extras.touCat('比劫') && !ctx.touCat('官杀') && !extras.touCat('官杀')
  )
  const withExtrasFormed = extClean

  return emitGeju(
    { name: '正财格', note: '月令正财 (本气或透根)，身可任，比劫紧贴有官杀制' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

/**
 * 偏财格 — 月令偏财，身能担，无比劫夺财。
 *
 * bazi-skills 4+2 条:
 *  1. 月令本气偏财 OR 月令藏 + 透干              [静态]
 *  2. 偏财藏透无严苛禁忌
 *  3. 日主身强要求宽松 (不极弱无根即可)          [静态]
 *  4. 无比劫紧贴夺财 (除非食伤化或官杀制)        [岁运透比劫无救 → Break]
 *  5. 时上偏财格 (升格)
 *  6. (升格) 食伤生财 / 财生官杀
 */
function isPianCaiGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const strength = ctx.strength
  const extras = ctx.extras

  if (!monthGeFormed(ctx, '偏财')) return null
  const isExtremelyWeak = strength.level === '身极弱' || strength.level === '近从弱'
  if (isExtremelyWeak && ss.countCat('比劫') + ss.countCat('印') === 0) return null

  const bijieAdjCai =
    ss.adjacentTou('劫财', '偏财') || ss.adjacentTou('比肩', '偏财')
  const baseClean = !(bijieAdjCai && !ctx.touCat('食伤') && !ctx.touCat('官杀'))
  const baseFormed = baseClean

  const extClean = baseClean && !(
    extras.touCat('比劫')
    && !ctx.touCat('食伤') && !ctx.touCat('官杀')
    && !extras.touCat('食伤') && !extras.touCat('官杀')
  )
  const withExtrasFormed = extClean

  return emitGeju(
    { name: '偏财格', note: '月令偏财 (本气或透根)，身可担，比劫紧贴有食伤/官杀化' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

/**
 * 正印格 — 月令正印，无财破印，身印平衡。
 *
 * bazi-skills 4+1 条:
 *  1. 月令本气正印 OR 月令藏 + 透干              [静态]
 *  2. 正印透干通根                                [由 monthGeFormed 近似]
 *  3. 无财紧贴破印 (除非比劫救)                  [岁运透财无比劫救 → Break]
 *  4. 身印平衡 (身极旺无财食伤泄 → 闷气机)       [静态]
 *  5. (升格) 官印相生 → 转 官印相生
 */
function isZhengYinGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const strength = ctx.strength
  const extras = ctx.extras

  if (!monthGeFormed(ctx, '正印')) return null
  if (strength.level === '身极旺' && !ctx.touCat('财') && !ctx.touCat('食伤')) return null

  const caiAdjYin =
    ss.adjacentTou('正财', '正印') || ss.adjacentTou('偏财', '正印')
  const baseClean = !(caiAdjYin && !ctx.touCat('比劫'))
  const baseFormed = baseClean

  const extClean = baseClean && !(
    extras.touCat('财') && !ctx.touCat('比劫') && !extras.touCat('比劫')
  )
  const withExtrasFormed = extClean

  return emitGeju(
    { name: '正印格', note: '月令正印 (本气或透根)，无紧贴财破印' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

/**
 * 偏印格 — 月令偏印，量不过重，无枭夺食。
 *
 * bazi-skills 5 条:
 *  1. 月令本气偏印 OR 月令藏 + 透干              [静态]
 *  2. 偏印透干通根                                [由 monthGeFormed 近似]
 *  3. 无偏印紧贴食神 (除非财救)                  [岁运透偏印 → 加重 Break]
 *  4. 身印关系 (身极旺印重需另取用)              [静态]
 *  5. 偏印不宜过重 (透 + 主气 ≤ 2)               [岁运透偏印 → 超阈 Break]
 */
function isPianYinGe(ctx: GejuContext): GejuHit | null {
  const ss = ctx.ss
  const strength = ctx.strength
  const extras = ctx.extras

  if (!monthGeFormed(ctx, '偏印')) return null
  if (strength.level === '身极旺') return null

  const ganCount = ctx.mainArr.filter((p) => ctx.ganShishenOf(p) === '偏印').length
  const mainCount = ctx.mainAt('偏印').length
  if (ganCount + mainCount > 2) return null

  const xiao = ss.tou('偏印')[0] && ss.adjacentTou('偏印', '食神') && !ctx.touCat('财')
  const baseFormed = !xiao

  // 岁运: 偏印加量 → 超阈 Break; 透偏印贴食神且无财救 → Break
  const extraXiaoTou = extras.extraArr.filter((p) => ctx.ganShishenOf(p) === '偏印').length
  const extOverflow = (ganCount + mainCount + extraXiaoTou) > 2
  const extXiao = xiao || (
    extras.tou('偏印') && !ctx.touCat('财') && !extras.touCat('财')
  )
  const withExtrasFormed = !extXiao && !extOverflow

  return emitGeju(
    { name: '偏印格', note: '月令偏印 (本气或透根)，量不过重，食神有护' },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}

export {
  isZhengGuanGe,
  isQiShaGe,
  isShiShenYueLingGe,
  isShangGuanGe,
  isZhengCaiGe,
  isPianCaiGe,
  isZhengYinGe,
  isPianYinGe,
}
