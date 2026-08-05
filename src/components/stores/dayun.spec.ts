import { beforeEach, describe, expect, test } from 'bun:test'
import { useDayun, type DaYunData } from './dayun'

const data: DaYunData = {
  forward: true,
  startYear: 2020,
  startMonth: 1,
  startDay: 1,
  steps: [
    { index: 1, startAge: 1, endAge: 10, startYear: 2020, endYear: 2029, gz: '甲子' },
    { index: 2, startAge: 11, endAge: 20, startYear: 2030, endYear: 2039, gz: '乙丑' },
  ],
  liunian: [
    Array.from({ length: 10 }, (_, index) => {
      const year = 2020 + index
      return {
        age: index + 1, year, gz: '甲子',
        liuyue: [{ monthName: '测试', gz: '丙寅', liuri: [
          { date: `${year}-01-01`, gz: '甲子' }, { date: `${year}-01-31`, gz: '乙丑' },
          { date: `${year}-12-01`, gz: '丙寅' }, { date: `${year}-12-31`, gz: '丁卯' },
        ] }],
      }
    }),
    Array.from({ length: 10 }, (_, index) => {
      const year = 2030 + index
      return {
        age: index + 11, year, gz: '乙丑',
        liuyue: [{ monthName: '测试', gz: '丁卯', liuri: [
          { date: `${year}-01-01`, gz: '戊辰' }, { date: `${year}-01-31`, gz: '己巳' },
          { date: `${year}-12-01`, gz: '庚午' }, { date: `${year}-12-31`, gz: '辛未' },
        ] }],
      }
    }),
  ],
}

beforeEach(() => useDayun.getState().setDayun(data))

describe('dayun distribution cursor', () => {
  test('按月跨界时同步流年和大运选择', () => {
    useDayun.getState().setSelection(0, 9, { year: 2029, month: 12, day: 31 })
    useDayun.getState().moveDistributionCursor(1, 'month', 1)
    expect(useDayun.getState()).toMatchObject({
      activeIdx: 1,
      activeLnIdx: 0,
      activeLyIdx: 0,
      activeLrIdx: 1,
      distributionCursor: { year: 2030, month: 1, day: 31 },
    })
  })

  test('只选大运时按月移动会同步选择游标所在流年', () => {
    useDayun.getState().setSelection(0, null, { year: 2029, month: 12, day: 1 })
    useDayun.getState().moveDistributionCursor(1, 'month', 1)
    expect(useDayun.getState()).toMatchObject({
      activeIdx: 1,
      activeLnIdx: 0,
      activeLyIdx: 0,
      activeLrIdx: 0,
      distributionCursor: { year: 2030, month: 1, day: 1 },
    })
  })
})
