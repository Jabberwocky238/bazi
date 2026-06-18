/**
 * 格局判定用 — 快照上下文。
 * detectGeju() 调用前先设置快照，所有 detector 通过 read*() 函数读取。
 * 这是为了避免修改 50+ 个 detector 的签名，同时保持纯函数语义。
 */
// 基础类型导入
import type { DetailedPillar } from '../base'
import type { Gan, Season, ShishenCat, WuXing, Zhi, Shishen } from '@jabberwocky238/bazi-engine'
import type { BaziDerived, ShishenDerived } from '../base'
import {
  ganWxCount, zhiMainWxCount, touWx, rootWx, rootExt,
  tou, touCat, zang, has, hasCat, mainAt, strong, strongCat,
  countOf, countCat, adjacentTou
} from '../base'
import type { StrengthDerived } from '../strength'
import { ganWuxing, zhiWuxing, type Pillar as EnginePillar } from '@jabberwocky238/bazi-engine'
import type { DaYunMeta } from './types'
import { SHI_SHEN_CAT } from '../base'
/**
 * 格局判定用 — 主局快照 (一次拿齐主局相关全部字段)。
 * pillars 已重整为 {year, month, day, hour, dayun, liunian}。
 */
export interface BaziSnapshot extends BaziDerived {
  pillars: { year: DetailedPillar; month: DetailedPillar; day: DetailedPillar; hour: DetailedPillar; dayun?: DetailedPillar; liunian?: DetailedPillar }
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
    ganWxCount: (wx: WuXing) => ganWxCount(derived.mainArr, wx),
    zhiMainWxCount: (wx: WuXing) => zhiMainWxCount(derived.mainArr, wx),
    touWx: (wx: WuXing) => touWx(derived.mainArr, wx),
    rootWx: (wx: WuXing) => rootWx(derived.mainArr, wx),
    rootExt: (wx: WuXing) => rootExt(derived.mainArr, wx),
  }
}
/** 格局判定用 — 十神快照。 */
export interface ShishenSnapshot extends ShishenDerived {
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
export function createShishenSnapshot(derived: ShishenDerived, pillars: DetailedPillar[]): ShishenSnapshot {
  return {
    ...derived,
    tou: (s) => tou(derived, s),
    touCat: (c) => touCat(derived, c),
    zang: (s) => zang(derived, s),
    has: (s) => has(derived, s),
    hasCat: (c) => hasCat(derived, c),
    mainAt: (s) => mainAt(derived, s),
    strong: (s) => strong(derived, s),
    strongCat: (c) => strongCat(pillars, c),
    countOf: (s) => countOf(derived, s),
    countCat: (c) => countCat(derived, c),
    adjacentTou: (s1, s2) => adjacentTou(pillars, s1, s2),
  }
}
/** 格局判定用 — 身强弱快照。 */
export interface StrengthSnapshot extends StrengthDerived {}
export function createStrengthSnapshot(derived: StrengthDerived): StrengthSnapshot {
  return derived
}
/**
 * 格局判定用 — 岁运快照。
 * GejuPanel 选中大运/流年时传入; detector 通过 snapshot 读取。
 */
export interface ExtrasSnapshot {
  extraArr: DetailedPillar[]
  extraPillars: DetailedPillar[]
  daYunMeta: DaYunMeta | null
  /** 是否非空 (有大运 / 流年)。 */
  active: boolean
  extraGanWxCount: (wx: WuXing) => number
  extraZhiMainWxCount: (wx: WuXing) => number
  /** 岁运柱天干十神 是否含 s。 */
  tou: (s: Shishen) => boolean
  /** 岁运柱天干十神 是否含 类别 c。 */
  touCat: (c: ShishenCat) => boolean
  /** 岁运柱地支藏干十神 是否含 s。 */
  zang: (s: Shishen) => boolean
  /** 岁运柱 (透或藏) 是否含 s。 */
  has: (s: Shishen) => boolean
  /** 岁运柱 (透或藏) 是否含类别 c。 */
  hasCat: (c: ShishenCat) => boolean
}
export function createExtrasSnapshot(extras: { dayun?: DetailedPillar; liunian?: DetailedPillar; daYunMeta?: DaYunMeta } = {}): ExtrasSnapshot {
  const arr: DetailedPillar[] = []
  if (extras.dayun) arr.push(extras.dayun)
  if (extras.liunian) arr.push(extras.liunian)
  const ganShishens = arr.map((p) => p.shishen as Shishen).filter(Boolean)
  const allShishens = arr.flatMap((p) => [p.shishen as Shishen, ...(p.hideShishen ?? [])]).filter(Boolean)
  return {
    extraArr: arr,
    extraPillars: arr,
    daYunMeta: extras.daYunMeta ?? null,
    active: arr.length > 0,
    extraGanWxCount: (wx) =>
      arr.filter((p) => ganWuxing(p.gan as EnginePillar['gan']) === wx).length,
    extraZhiMainWxCount: (wx) =>
      arr.filter((p) => zhiWuxing(p.zhi as EnginePillar['zhi']) === wx).length,
    tou: (ss) => ganShishens.includes(ss),
    touCat: (c) => ganShishens.some((ss) => SHI_SHEN_CAT[ss] === c),
    zang: (ss) => arr.some((p) => p.hideShishen?.includes(ss)),
    has: (ss) => allShishens.includes(ss),
    hasCat: (c) => allShishens.some((ss) => SHI_SHEN_CAT[ss] === c),
  }
}
// 快照上下文管理
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
