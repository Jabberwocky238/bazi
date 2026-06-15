/**
 * 格局判定用 — 主局快照 (一次拿齐主局相关全部字段).
 * 等价于过去 Ctx 的主局段; pillars 已重整为 {year, month, day, hour, dayun, liunian}.
 */
import { useBazi as useBaziStore } from '../../shishen'
import { useGejuExtras } from './useExtras'
import type { Pillar } from '../../store'
import type { Gan, Season, ShishenCat, WuXing, Zhi } from '@jabberwocky238/bazi-engine'

export interface BaziSnapshot {
  pillars: { year: Pillar; month: Pillar; day: Pillar; hour: Pillar; dayun?: Pillar; liunian?: Pillar }
  season: Season | ''
  dayYang: boolean
  dayGan: Gan
  dayZhi: Zhi
  dayGz: string
  dayWx: WuXing
  yearZhi: Zhi
  monthZhi: Zhi
  monthCat: ShishenCat | ''
  monthZhiBeingChong: boolean
  mainArr: Pillar[]
  ganSet: Set<Gan>
  ganWxCount: (wx: WuXing) => number
  zhiMainWxCount: (wx: WuXing) => number
  touWx: (wx: WuXing) => boolean
  rootWx: (wx: WuXing) => boolean
  rootExt: (wx: WuXing) => boolean
}

export function readBazi(): BaziSnapshot {
  const s = useBaziStore.getState()
  const ext = useGejuExtras.getState()
  const [year, month, day, hour] = s.pillars
  return {
    pillars: {
      year: year!, month: month!, day: day!, hour: hour!,
      dayun: ext.dayun ?? undefined,
      liunian: ext.liunian ?? undefined,
    },
    season: s.season,
    dayYang: s.dayYang,
    dayGan: s.dayGan as Gan,
    dayZhi: s.dayZhi as Zhi,
    dayGz: s.dayGz,
    dayWx: s.dayWx as WuXing,
    yearZhi: s.yearZhi as Zhi,
    monthZhi: s.monthZhi as Zhi,
    monthCat: s.monthCat,
    monthZhiBeingChong: s.monthZhiBeingChong,
    mainArr: s.mainArr,
    ganSet: s.ganSet,
    ganWxCount: s.ganWxCount,
    zhiMainWxCount: s.zhiMainWxCount,
    touWx: s.touWx,
    rootWx: s.rootWx,
    rootExt: s.rootExt,
  }
}
