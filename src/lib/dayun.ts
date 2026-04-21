import { Solar } from 'lunar-typescript'
import type { Sex } from '@jabberwocky238/bazi-engine'
import { HOUR_UNKNOWN } from './shishen'

export interface DaYunStep {
  /** lunar-typescript 的原始 index；0 表示起运前 */
  index: number
  startAge: number
  endAge: number
  startYear: number
  endYear: number
  /** 干支，如 "甲子"；起运前可能为空串 */
  gz: string
}

export interface LiuYueEntry {
  /** 月建中文名：正/二/…/腊。 */
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
  /** 十步大运（含起运前） */
  steps: DaYunStep[]
  /** liunian[stepIndex] = 对应大运内的 10 流年 */
  liunian: LiuNianEntry[][]
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
    const solar = Solar.fromYmdHms(year, month, day, hour, minute, 0)
    const ec = solar.getLunar().getEightChar()
    // sect=1：早子换日派，与 shishen.ts 一致
    ec.setSect(1)
    const yun = ec.getYun(sex, 1)
    const rawSteps = yun.getDaYun(10)
    const steps: DaYunStep[] = rawSteps.map((dy) => ({
      index: dy.getIndex(),
      startAge: dy.getStartAge(),
      endAge: dy.getEndAge(),
      startYear: dy.getStartYear(),
      endYear: dy.getEndYear(),
      gz: dy.getGanZhi(),
    }))
    const liunian: LiuNianEntry[][] = rawSteps.map((dy) =>
      dy.getLiuNian(10).map((ln) => ({
        age: ln.getAge(),
        year: ln.getYear(),
        gz: ln.getGanZhi(),
        liuyue: ln.getLiuYue().map((ly) => ({
          monthName: ly.getMonthInChinese(),
          gz: ly.getGanZhi(),
        })),
      })),
    )
    return {
      forward: yun.isForward(),
      startYear: yun.getStartYear(),
      startMonth: yun.getStartMonth(),
      startDay: yun.getStartDay(),
      steps,
      liunian,
    }
  } catch {
    return null
  }
}
