/**
 * 扶抑（依 扶抑.md 五大情况）+ 病根选取 + 调候硬约束 + 强弱归类。
 * 不含从格/专旺格覆写（在 index.ts orchestrator 处理）。
 */
import type { Pillar } from '../store'
import { CAT_OF_SHISHEN, type Cat, type WuXing } from './types'

const STRONG_LV = new Set(['身极旺', '身旺', '身中强', '身中(偏强)'])
const WEAK_LV = new Set(['身略弱', '身弱', '身极弱', '近从弱', '身中(偏弱)'])

export function sideOf(level: string): 'strong' | 'weak' | 'neutral' {
  if (STRONG_LV.has(level)) return 'strong'
  if (WEAK_LV.has(level)) return 'weak'
  return 'neutral'
}

/** 判定五大情况中"病根"最重的那一类。 */
export function pickSickCat(pillars: Pillar[], side: 'strong' | 'weak'): Cat | null {
  const cnt: Record<Cat, number> = { 比劫: 0, 印: 0, 食伤: 0, 财: 0, 官杀: 0 }
  const ganShens = [pillars[0].shishen, pillars[1].shishen, pillars[3].shishen]
  for (const s of ganShens) {
    const c = CAT_OF_SHISHEN[s]
    if (c) cnt[c] += 1
  }
  for (const p of pillars) {
    for (const s of p.hideShishen) {
      const c = CAT_OF_SHISHEN[s]
      if (c) cnt[c] += 1
    }
  }
  if (side === 'strong') {
    return cnt.印 >= cnt.比劫 ? '印' : '比劫'
  }
  const others: Cat[] = ['官杀', '食伤', '财']
  others.sort((a, b) => cnt[b] - cnt[a])
  return cnt[others[0]] > 0 ? others[0] : null
}

export interface FuYiResult {
  sickCat: Cat | null
  primaryCat: Cat | null
  secondaryCat: Cat | null
  avoidCats: Cat[]
  reason: string
}

/** 扶抑五大情况：依 side 和 sickCat 选取喜用 / 忌神。 */
export function pickFuYi(pillars: Pillar[], side: 'strong' | 'weak' | 'neutral'): FuYiResult {
  if (side === 'strong') {
    const sickCat = pickSickCat(pillars, 'strong')
    if (sickCat === '印') {
      return {
        sickCat,
        primaryCat: '财',
        secondaryCat: '食伤',
        avoidCats: ['印', '比劫'],
        reason: '身旺印多（情况四）→ 财克印切源头为首，食伤泄身为次；官杀生印生身禁用',
      }
    }
    return {
      sickCat,
      primaryCat: '食伤',
      secondaryCat: '官杀',
      avoidCats: ['比劫', '印'],
      reason: '身旺比劫重（情况五）→ 比劫旺喜泄不喜克，食伤泄秀为首、官杀次之',
    }
  }
  if (side === 'weak') {
    const sickCat = pickSickCat(pillars, 'weak')
    if (sickCat === '官杀') {
      return {
        sickCat,
        primaryCat: '印',
        secondaryCat: '比劫',
        avoidCats: ['官杀', '财'],
        reason: '身弱官杀旺（情况一）→ 印化官杀生身为首；禁用食伤以免克泄交加',
      }
    }
    if (sickCat === '财') {
      return {
        sickCat,
        primaryCat: '比劫',
        secondaryCat: '印',
        avoidCats: ['财', '官杀', '食伤'],
        reason: '身弱财多（情况二）→ 比劫克财帮身为首，印次之（印易被财克）',
      }
    }
    return {
      sickCat,
      primaryCat: '印',
      secondaryCat: '比劫',
      avoidCats: ['食伤', '财', '官杀'],
      reason: '身弱食伤泄身（情况三）→ 印克食伤并生身一举两得',
    }
  }
  return {
    sickCat: null,
    primaryCat: null,
    secondaryCat: null,
    avoidCats: [],
    reason: '身中和 / 临界 → 扶抑法结论模糊，需结合调候、大运流年具体定夺',
  }
}

/** 调候硬约束（寒暖燥湿）。 */
export function computeTiaohou(monthZhi: string, dayWx: WuXing): {
  required: boolean
  wx: WuXing | null
  note: string
} {
  if (['亥', '子', '丑'].includes(monthZhi) && dayWx !== '火') {
    return { required: true, wx: '火', note: `${monthZhi}月至寒，硬约束需火暖局` }
  }
  if (['巳', '午', '未'].includes(monthZhi) && dayWx !== '水') {
    return { required: true, wx: '水', note: `${monthZhi}月至暖，硬约束需水润局` }
  }
  return { required: false, wx: null, note: '月令非至寒至暖，调候非硬约束' }
}
