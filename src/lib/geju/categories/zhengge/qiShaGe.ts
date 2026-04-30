import { readBazi, readExtras, readShishen, readStrength } from '../../hooks'
import { YANG_REN } from '../../types'
import type { Gan } from '@jabberwocky238/bazi-engine'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'
import { emitGeju } from '../../_emit'

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
export function isQiShaGe(): GejuHit | null {
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
