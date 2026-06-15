/** 格局判定用 — 十神快照. */
import { useShishen as useShishenStore } from '../../shishen'
import type { Shishen, ShishenCat } from '@jabberwocky238/bazi-engine'

export interface ShishenSnapshot {
  ganSs: Shishen[]
  mainZhiArr: string[]
  allZhiArr: Shishen[]
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

export function readShishen(): ShishenSnapshot {
  const s = useShishenStore.getState()
  return {
    ganSs: s.ganSs,
    mainZhiArr: s.mainZhiArr,
    allZhiArr: s.allZhiArr,
    tou: s.tou,
    touCat: s.touCat,
    zang: s.zang,
    has: s.has,
    hasCat: s.hasCat,
    mainAt: s.mainAt,
    strong: s.strong,
    strongCat: s.strongCat,
    countOf: s.countOf,
    countCat: s.countCat,
    adjacentTou: s.adjacentTou,
  }
}
