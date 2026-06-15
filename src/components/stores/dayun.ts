/**
 * 大运 / 流年 / 流月 DTO + zustand store。所有公历/历法转换在这里, lib 不参与。
 */
import { create } from 'zustand'
import {
  computeDaYun as engineComputeDaYun,
  type Sex,
} from '@jabberwocky238/bazi-engine'
import { HOUR_UNKNOWN } from '@/lib'

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
  setDayun: (d: DaYunData | null) => void
}

export const useDayun = create<DaYunStore>()((set) => ({
  data: null,
  setDayun: (d) => set({ data: d }),
}))
