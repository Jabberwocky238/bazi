import { readBazi, readShishen, readStrength } from '../../hooks'
import { WX_GENERATED_BY } from '../../types'
import type { WuXing, Zhi } from '@jabberwocky238/bazi-engine'

/**
 * 专旺共用判据 — md 严格版:
 *  ① 日主属 targetWx, 月令得令。
 *  ② 地支须 三合局 OR 三会方局 (土稼穑 用 四库齐 替代)。
 *  ③ 天干 targetWx 另见 ≥ 1 位 (日主外 共 ≥ 2)。
 *  ④ 不见官杀 (透或藏一律破)。
 *  ⑤ 不见财 (透 ≥ 1 即破; 稼穑等子格 maxCaiTou 放宽)。
 *  ⑥ 食伤 不过重 (透 ≥ 1 即破; 食伤泄秀属另成局, 此处严判)。
 */
const SANHE_TRIPLES: Record<string, readonly Zhi[]> = {
  木: ['亥', '卯', '未'],
  火: ['寅', '午', '戌'],
  金: ['巳', '酉', '丑'],
  水: ['申', '子', '辰'],
}
const SANHUI_TRIPLES: Record<string, readonly Zhi[]> = {
  木: ['寅', '卯', '辰'],
  火: ['巳', '午', '未'],
  金: ['申', '酉', '戌'],
  水: ['亥', '子', '丑'],
}
const SI_KU: readonly Zhi[] = ['辰', '戌', '丑', '未']

function hasAll(zhis: Zhi[], triple: readonly Zhi[]): boolean {
  return triple.every((z) => zhis.includes(z))
}

export function checkZhuanWang(
  targetWx: string,
  maxCaiTou = 0,
): { note: string } | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const strength = readStrength()
  if (bazi.dayWx !== targetWx) return null
  if (!strength.deLing) return null

  const selfWx = bazi.dayWx
  const yinWx = WX_GENERATED_BY[selfWx] as WuXing
  const zhis = bazi.mainArr.map((p) => p.zhi as Zhi)

  // ② 地支结构: 三合 / 三会 / (土) 四库
  let layoutNote = ''
  if (selfWx === '土') {
    if (!hasAll(zhis, SI_KU)) return null
    layoutNote = '四库齐 (稼穑)'
  } else {
    const sh = SANHE_TRIPLES[selfWx]
    const hh = SANHUI_TRIPLES[selfWx]
    if (sh && hasAll(zhis, sh)) layoutNote = `三合 ${sh.join('')}`
    else if (hh && hasAll(zhis, hh)) layoutNote = `三会 ${hh.join('')}`
    else return null
  }

  // ③ 天干同五行 ≥ 2 (含日主)
  if (bazi.ganWxCount(targetWx as WuXing) < 2) return null
  // ④ 不见官杀 (透或藏)
  if (shishen.hasCat('官杀')) return null
  // ⑥ 食伤 透 ≥ 1 即破
  if (shishen.touCat('食伤')) return null
  // ⑤ 财 透 ≤ maxCaiTou
  const caiTouN = (shishen.tou('正财') ? 1 : 0) + (shishen.tou('偏财') ? 1 : 0)
  if (caiTouN > maxCaiTou) return null
  // 稼穑额外: 财 (透 + 主气) 总位严控 < 2
  if (selfWx === '土' && maxCaiTou >= 1) {
    const caiMainZhi = shishen.mainZhiArr.filter((s) => s === '正财' || s === '偏财').length
    if (caiTouN + caiMainZhi >= 2) return null
  }

  void yinWx
  return {
    note: `${layoutNote} · ${selfWx} 透 ${bazi.ganWxCount(targetWx as WuXing)} 位${caiTouN ? `，财透${caiTouN}` : '，无官杀'}`,
  }
}
