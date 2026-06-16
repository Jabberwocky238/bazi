import { readBazi, readExtras, readShishen, readStrength } from '../hooks'
import { YANG_REN, type GejuHit } from '../types'
import { emitGeju } from '../_emit'
import type { Gan, Shishen } from '@jabberwocky238/bazi-engine'

/** 正格通用钩子：月支若是日主的阳刃/阴刃位 → 所有正格让位给阳刃格。 */
function deferToYangRen(): boolean {
  const bazi = readBazi()
  return bazi.monthZhi === YANG_REN[bazi.dayGan]
}

/**
 * 通用"月令X格"工厂 — 双路径入格 (与 md《子平真诠》一致)：
 *  - 月支若同时是阳刃位 → 归阳刃格独占, 所有正格不成立。
 *  - 路径 1: 月令**本气**为 target。
 *  - 路径 2: 月令中气 / 余气藏 target, 且 target **透干**。
 */
function monthGeFormed(target: Shishen): boolean {
  if (deferToYangRen()) return false
  const bazi = readBazi()
  const shishen = readShishen()
  const monthHide = bazi.pillars.month.hideShishen as Shishen[]
  if ((monthHide[0] as Shishen | undefined) === target) return true
  if (monthHide.includes(target) && shishen.tou(target)) return true
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
function isZhengGuanGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('正官')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const baseClean2 = !shishen.tou('七杀')
  const baseClean3 = !(shishen.tou('伤官') && shishen.adjacentTou('伤官', '正官') && !shishen.touCat('印'))
  const baseFormed = baseClean2 && baseClean3

  const extClean2 = baseClean2 && !extras.tou('七杀')
  const extClean3 = baseClean3 && !(extras.tou('伤官') && !shishen.touCat('印') && !extras.touCat('印'))
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
function zhengGuanHeQu(): boolean {
  const bazi = readBazi()
  const heTarget = HE_GAN[bazi.dayGan]
  const guanGan = ZHENG_GUAN[bazi.dayGan]
  if (heTarget !== guanGan) return false
  return bazi.pillars.month.gan === guanGan || bazi.pillars.hour.gan === guanGan
}

/**
 * 七杀格 — md 全部铁律 + 岁运:
 *  ① 月令本气七杀 / 月令藏 + 七杀透 (monthGeFormed 双路径)。
 *  ② 正官透且未被日干合去 → 破 (主局 / 岁运皆判)。
 *  ③ 必有制 (食神) 或化 (印星) — 主局 OR 岁运补。
 *  ④ 身非极弱 / 近从弱 (极弱归从杀)。
 */
function isQiShaGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()
  if (!monthGeFormed('七杀')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const heQu = zhengGuanHeQu()
  const baseGuanBlock = shishen.tou('正官') && !heQu
  const extrasGuanBlock = baseGuanBlock || (extras.tou('正官') && !heQu)

  const baseHasZhi = shishen.has('食神')
  const baseHasHua = shishen.hasCat('印')
  const baseControl = baseHasZhi || baseHasHua
  const withExtrasControl = baseControl || extras.has('食神') || extras.hasCat('印')

  const baseFormed = !baseGuanBlock && baseControl
  const withExtrasFormed = !extrasGuanBlock && withExtrasControl

  const foodControl = shishen.tou('食神') && shishen.zang('食神') && shishen.adjacentTou('食神', '七杀')
  const yinHua = shishen.touCat('印') && (shishen.zang('正印') || shishen.zang('偏印'))
  const renDiSha = bazi.dayYang && bazi.mainArr.some(
    (p, i) => i !== 2 && p.zhi === (YANG_REN[bazi.dayGan] ?? ''),
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
function isShiShenYueLingGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('食神')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const xiaoDuoShi =
    shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')
  const baseFormed = !xiaoDuoShi

  const extXiaoDuoShi = xiaoDuoShi || (
    extras.tou('偏印') && !shishen.touCat('财') && !extras.touCat('财')
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
function isShangGuanGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('伤官')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const baseClean3 = !shishen.tou('正官')
  const baseClean5 = !shishen.tou('食神')
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
function isZhengCaiGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('正财')) return null
  if (strength.level === '身极弱' || strength.level === '近从弱') return null

  const bijieAdjCai =
    shishen.adjacentTou('劫财', '正财') || shishen.adjacentTou('比肩', '正财')
  const baseClean = !(bijieAdjCai && !shishen.touCat('官杀'))
  const baseFormed = baseClean

  const extClean = baseClean && !(
    extras.touCat('比劫') && !shishen.touCat('官杀') && !extras.touCat('官杀')
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
function isPianCaiGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('偏财')) return null
  const isExtremelyWeak = strength.level === '身极弱' || strength.level === '近从弱'
  if (isExtremelyWeak && shishen.countCat('比劫') + shishen.countCat('印') === 0) return null

  const bijieAdjCai =
    shishen.adjacentTou('劫财', '偏财') || shishen.adjacentTou('比肩', '偏财')
  const baseClean = !(bijieAdjCai && !shishen.touCat('食伤') && !shishen.touCat('官杀'))
  const baseFormed = baseClean

  const extClean = baseClean && !(
    extras.touCat('比劫')
    && !shishen.touCat('食伤') && !shishen.touCat('官杀')
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
function isZhengYinGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('正印')) return null
  if (strength.level === '身极旺' && !shishen.touCat('财') && !shishen.touCat('食伤')) return null

  const caiAdjYin =
    shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('偏财', '正印')
  const baseClean = !(caiAdjYin && !shishen.touCat('比劫'))
  const baseFormed = baseClean

  const extClean = baseClean && !(
    extras.touCat('财') && !shishen.touCat('比劫') && !extras.touCat('比劫')
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
function isPianYinGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  const extras = readExtras()

  if (!monthGeFormed('偏印')) return null
  if (strength.level === '身极旺') return null

  const ganCount = bazi.mainArr.filter((p) => p.shishen === '偏印').length
  const mainCount = shishen.mainAt('偏印').length
  if (ganCount + mainCount > 2) return null

  const xiao = shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')
  const baseFormed = !xiao

  // 岁运: 偏印加量 → 超阈 Break; 透偏印贴食神且无财救 → Break
  const extraXiaoTou = extras.extraArr.filter((p) => p.shishen === '偏印').length
  const extOverflow = (ganCount + mainCount + extraXiaoTou) > 2
  const extXiao = xiao || (
    extras.tou('偏印') && !shishen.touCat('财') && !extras.touCat('财')
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
