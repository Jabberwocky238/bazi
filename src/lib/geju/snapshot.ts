/**
 * 格局判定用 — 快照上下文。直接使用 @jabberwocky238/bazi-engine 的 Calculator。
 */
import Calculator, { type DetailedPillar, type ShishenCalculator } from '@jabberwocky238/bazi-engine/calculator'
import type { BaziDerived } from '../base'
import type { StrengthDerived } from '../strength'
import type { Gan, Season, ShishenCat, WuXing, Zhi, Shishen } from '@jabberwocky238/bazi-engine'
import { ganWuxing, zhiWuxing } from '@jabberwocky238/bazi-engine'
import type { DaYunMeta } from './types'
import { SHI_SHEN_CAT } from '../base'

export interface BaziSnapshot extends BaziDerived {
  pillars: { year: DetailedPillar; month: DetailedPillar; day: DetailedPillar; hour: DetailedPillar; dayun?: DetailedPillar; liunian?: DetailedPillar }
  calc: Calculator
  ganWxCount: (wx: WuXing) => number
  zhiMainWxCount: (wx: WuXing) => number
  touWx: (wx: WuXing) => boolean
  rootWx: (wx: WuXing) => boolean
  rootExt: (wx: WuXing) => boolean
}

export function createBaziSnapshot(
  derived: BaziDerived,
  extras?: { dayun?: DetailedPillar; liunian?: DetailedPillar },
): BaziSnapshot {
  const [year, month, day, hour] = derived.mainArr

  const input = {
    year: { gan: year.gan.name, zhi: year.zhi.name },
    month: { gan: month.gan.name, zhi: month.zhi.name },
    day: { gan: day.gan.name, zhi: day.zhi.name },
    hour: hour.gan.name ? { gan: hour.gan.name, zhi: hour.zhi.name } : undefined,
    sex: 1,
  }
  const calc = new Calculator(input, 1)

  return {
    ...derived,
    pillars: {
      year: year!,
      month: month!,
      day: day!,
      hour: hour!,
      dayun: extras?.dayun,
      liunian: extras?.liunian,
    },
    calc,
    ganWxCount: (wx: WuXing) => calc.ganWxCount(wx),
    zhiMainWxCount: (wx: WuXing) => calc.zhiMainWxCount(wx),
    touWx: (wx: WuXing) => calc.touWx(wx),
    rootWx: (wx: WuXing) => calc.rootWx(wx),
    rootExt: (wx: WuXing) => calc.rootExt(wx),
  }
}

export interface ShishenSnapshot {
  dayGan: Gan | ''
  byPillar: Shishen[]
  hideByPillar: Shishen[][]
  ganSs: Shishen[]
  mainZhiArr: string[]
  allZhiArr: Shishen[]
  ssCalc: ShishenCalculator
  pillars: DetailedPillar[]
  tou: (s: Shishen) => boolean
  touCat: (c: ShishenCat) => boolean
  zang: (s: Shishen) => boolean
  has: (s: Shishen) => boolean
  hasCat: (c: ShishenCat) => boolean
  mainAt: (s: Shishen) => number[]
  strong: (s: Shishen) => boolean
  strongCat: (c: ShishenCat) => boolean
  countOf: (s: Shishen) => number
  countCat: (c: ShishenCat) => number
  adjacentTou: (s1: Shishen, s2: Shishen) => boolean
}

export function createShishenSnapshot(derived: { dayGan: Gan | ''; byPillar: Shishen[]; hideByPillar: Shishen[][]; ganSs: Shishen[]; mainZhiArr: string[]; allZhiArr: Shishen[] }, pillars: DetailedPillar[]): ShishenSnapshot {
  const [year, month, day, hour] = pillars
  const input = {
    year: { gan: year.gan.name, zhi: year.zhi.name },
    month: { gan: month.gan.name, zhi: month.zhi.name },
    day: { gan: day.gan.name, zhi: day.zhi.name },
    hour: hour.gan.name ? { gan: hour.gan.name, zhi: hour.zhi.name } : undefined,
    sex: 1,
  }
  const calc = new Calculator(input, 1)
  const ssCalc = calc.shishen()

  return {
    ...derived,
    pillars,
    ssCalc,
    tou: (s) => ssCalc.tou(s),
    touCat: (c) => ssCalc.touCat(c),
    zang: (s) => ssCalc.zang(s),
    has: (s) => ssCalc.has(s),
    hasCat: (c) => ssCalc.hasCat(c),
    mainAt: (s) => ssCalc.mainAt(s),
    strong: (s) => ssCalc.strong(s),
    strongCat: (c) => ssCalc.strongCat(c),
    countOf: (s) => ssCalc.countOf(s),
    countCat: (c) => ssCalc.countCat(c),
    adjacentTou: (s1, s2) => ssCalc.adjacentTou(calc.pillars(), s1, s2),
  }
}

export interface StrengthSnapshot extends StrengthDerived {}

export function createStrengthSnapshot(derived: StrengthDerived): StrengthSnapshot {
  return derived
}

export interface ExtrasSnapshot {
  extraArr: DetailedPillar[]
  extraPillars: DetailedPillar[]
  daYunMeta: DaYunMeta | null
  active: boolean
  extraGanWxCount: (wx: WuXing) => number
  extraZhiMainWxCount: (wx: WuXing) => number
  tou: (s: Shishen) => boolean
  touCat: (c: ShishenCat) => boolean
  zang: (s: Shishen) => boolean
  has: (s: Shishen) => boolean
  hasCat: (c: ShishenCat) => boolean
}

export function createExtrasSnapshot(extras: { dayun?: DetailedPillar; liunian?: DetailedPillar; daYunMeta?: DaYunMeta } = {}): ExtrasSnapshot {
  const arr: DetailedPillar[] = []
  if (extras.dayun) arr.push(extras.dayun)
  if (extras.liunian) arr.push(extras.liunian)
  const ganShishens = arr.map((p) => p.gan.shishen as Shishen).filter(Boolean)
  const allShishens = arr.flatMap((p) => [p.gan.shishen as Shishen, ...(p.zhi.cangGan.map((c) => c.shishen))]).filter(Boolean)
  return {
    extraArr: arr,
    extraPillars: arr,
    daYunMeta: extras.daYunMeta ?? null,
    active: arr.length > 0,
    extraGanWxCount: (wx) => arr.filter((p) => ganWuxing(p.gan.name) === wx).length,
    extraZhiMainWxCount: (wx) => arr.filter((p) => zhiWuxing(p.zhi.name) === wx).length,
    tou: (ss) => ganShishens.includes(ss),
    touCat: (c) => ganShishens.some((ss) => SHI_SHEN_CAT[ss] === c),
    zang: (ss) => arr.some((p) => p.zhi.cangGan.some((c) => c.shishen === ss)),
    has: (ss) => allShishens.includes(ss),
    hasCat: (c) => allShishens.some((ss) => SHI_SHEN_CAT[ss] === c),
  }
}

let currentBazi: BaziSnapshot | null = null
let currentShishen: ShishenSnapshot | null = null
let currentStrength: StrengthSnapshot | null = null
let currentExtras: ExtrasSnapshot | null = null

export function setGejuSnapshot(
  bazi: BaziSnapshot,
  shishen: ShishenSnapshot,
  strength: StrengthSnapshot,
  extras: ExtrasSnapshot,
): void {
  currentBazi = bazi
  currentShishen = shishen
  currentStrength = strength
  currentExtras = extras
}

export function clearGejuSnapshot(): void {
  currentBazi = null
  currentShishen = null
  currentStrength = null
  currentExtras = null
}

export function readBazi(): BaziSnapshot {
  if (!currentBazi) throw new Error('Bazi snapshot not set')
  return currentBazi
}

export function readShishen(): ShishenSnapshot {
  if (!currentShishen) throw new Error('Shishen snapshot not set')
  return currentShishen
}

export function readStrength(): StrengthSnapshot {
  if (!currentStrength) throw new Error('Strength snapshot not set')
  return currentStrength
}

export function readExtras(): ExtrasSnapshot {
  if (!currentExtras) throw new Error('Extras snapshot not set')
  return currentExtras
}
