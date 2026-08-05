/**
 * 大运 / 流年 / 流月 DTO + zustand store。所有公历/历法转换在这里, lib 不参与。
 */
import { create } from 'zustand'
import {
  computeDaYun as engineComputeDaYun,
  type Sex,
} from '@jabberwocky238/bazi-engine'
import { HOUR_UNKNOWN } from '@LIB'
import type { SamplingUnit } from '@LIB'

export interface DaYunStep {
  /** lunar-typescript 的原始 index; 0 表示起运前 */
  index: number
  startAge: number
  endAge: number
  startYear: number
  endYear: number
  /** 干支, 如 "甲子"; 起运前可能为空串 */
  gz: string
}

export interface LiuYueEntry {
  /** 月建中文名: 正/二/…/腊。 */
  monthName: string
  /** 干支字符串。 */
  gz: string
  /** 该流月节气区间内的流日。 */
  liuri: LiuRiEntry[]
}

export interface LiuRiEntry {
  /** 公历日期 YYYY-MM-DD。 */
  date: string
  gz: string
}

export interface LiuNianEntry {
  age: number
  year: number
  gz: string
  /** 12 流月。 */
  liuyue: LiuYueEntry[]
}

export interface DaYunData {
  forward: boolean
  startYear: number
  startMonth: number
  startDay: number
  /** 十步大运 (含起运前) */
  steps: DaYunStep[]
  /** liunian[stepIndex] = 对应大运内的流年 */
  liunian: LiuNianEntry[][]
}

function gzStr(gz: readonly [string, string] | null): string {
  return gz ? `${gz[0]}${gz[1]}` : ''
}

export function computeDaYun(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  sex: Sex,
): DaYunData | null {
  if (hour === HOUR_UNKNOWN) return null
  try {
    const dy = engineComputeDaYun(year, month, day, hour, minute, sex)
    const steps: DaYunStep[] = dy.steps.map((s) => ({
      index: s.index,
      startAge: s.startAge,
      endAge: s.endAge,
      startYear: s.startYear,
      endYear: s.endYear,
      gz: gzStr(s.gz),
    }))
    const liunian: LiuNianEntry[][] = dy.steps.map((s) =>
      s.liunian.map((ln) => ({
        age: ln.age,
        year: ln.year,
        gz: gzStr(ln.gz),
        liuyue: ln.liuyue.map((ly) => ({
          monthName: ly.monthName,
          gz: gzStr(ly.gz),
          liuri: ly.liuri.map((lr) => ({ date: lr.date, gz: gzStr(lr.gz) })),
        })),
      })),
    )
    return {
      forward: dy.forward,
      startYear: dy.startYear,
      startMonth: dy.startMonth,
      startDay: dy.startDay,
      steps,
      liunian,
    }
  } catch {
    return null
  }
}

interface DaYunStore {
  data: DaYunData | null
  activeIdx: number | null
  activeLnIdx: number | null
  activeLyIdx: number | null
  activeLrIdx: number | null
  distributionCursor: { year: number; month: number; day: number } | null
  setDayun: (d: DaYunData | null) => void
  setSelection: (
    activeIdx: number | null,
    activeLnIdx: number | null,
    cursor: { year: number; month: number; day: number } | null,
    activeLyIdx?: number | null,
    activeLrIdx?: number | null,
  ) => void
  moveDistributionCursor: (direction: -1 | 1, unit: SamplingUnit, pace: number) => void
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function shiftCursor(cursor: { year: number; month: number; day: number }, amount: number, unit: SamplingUnit) {
  if (unit === 'day') {
    const date = new Date(Date.UTC(cursor.year, cursor.month - 1, cursor.day + amount))
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
  }
  const monthIndex = unit === 'month'
    ? cursor.year * 12 + cursor.month - 1 + amount
    : (cursor.year + amount) * 12 + cursor.month - 1
  const year = Math.floor(monthIndex / 12)
  const month = ((monthIndex % 12) + 12) % 12 + 1
  return { year, month, day: Math.min(cursor.day, daysInMonth(year, month)) }
}

function cursorDate(cursor: { year: number; month: number; day: number }): string {
  return `${cursor.year}-${String(cursor.month).padStart(2, '0')}-${String(cursor.day).padStart(2, '0')}`
}

function locateDate(data: DaYunData, cursor: { year: number; month: number; day: number }) {
  const date = cursorDate(cursor)
  for (let activeIdx = 0; activeIdx < data.liunian.length; activeIdx += 1) {
    for (let activeLnIdx = 0; activeLnIdx < data.liunian[activeIdx].length; activeLnIdx += 1) {
      const liuyue = data.liunian[activeIdx][activeLnIdx].liuyue
      for (let activeLyIdx = 0; activeLyIdx < liuyue.length; activeLyIdx += 1) {
        const activeLrIdx = liuyue[activeLyIdx].liuri.findIndex((entry) => entry.date === date)
        if (activeLrIdx >= 0) return { activeIdx, activeLnIdx, activeLyIdx, activeLrIdx }
      }
    }
  }
  return null
}

export const useDayun = create<DaYunStore>()((set, get) => ({
  data: null,
  activeIdx: null,
  activeLnIdx: null,
  activeLyIdx: null,
  activeLrIdx: null,
  distributionCursor: null,
  setDayun: (d) => set({ data: d, activeIdx: null, activeLnIdx: null, activeLyIdx: null, activeLrIdx: null, distributionCursor: null }),
  setSelection: (activeIdx, activeLnIdx, distributionCursor, activeLyIdx = null, activeLrIdx = null) => {
    set({ activeIdx, activeLnIdx, activeLyIdx, activeLrIdx, distributionCursor })
  },
  moveDistributionCursor: (direction, unit, pace) => {
    const { data, activeIdx, activeLnIdx, distributionCursor } = get()
    if (!data || activeIdx === null || !distributionCursor) return
    const cursor = shiftCursor(distributionCursor, direction * pace, unit)
    const located = locateDate(data, cursor)
    if (!located) return
    set({ ...located, distributionCursor: cursor })
  },
}))
