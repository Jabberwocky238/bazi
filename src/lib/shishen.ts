import { Solar } from 'lunar-typescript'
import {
  computeShensha,
  computeShishen,
  type BaziInput,
  type Gan,
  type Zhi,
  type Sex,
} from '@jabberwocky238/bazi-engine'
import { ganWuxing, zhiWuxing, shishenWuxing } from './wuxing'
import { zizuoState } from './zizuo'
import { HOUR_UNKNOWN } from './bazi'
import { toTrueSolarDate, formatTrueSolar } from './truesolar'
import type { Pillar, BaziResult } from './store'

const EMPTY_PILLAR: Pillar = {
  label: '时柱',
  gz: '',
  gan: '',
  zhi: '',
  ganWuxing: '',
  zhiWuxing: '',
  wuxing: '',
  nayin: '',
  hideGans: [],
  shishen: '',
  shishenWuxing: '',
  hideShishen: [],
  hideShishenWuxings: [],
  shensha: [],
  zizuo: '',
}

export function computeBazi(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  sex: Sex,
): BaziResult {
  const hourKnown = hour !== HOUR_UNKNOWN && hour >= 0 && hour < 24
  const safeHour = hourKnown ? hour : 0
  const safeMinute = hourKnown && minute >= 0 && minute < 60 ? minute : 0
  const solar = Solar.fromYmdHms(year, month, day, safeHour, safeMinute, 0)
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()
  // sect=1：23:00 即换日（早子换日派）
  ec.setSect(1)

  const input: BaziInput = {
    year: { gan: ec.getYearGan() as Gan, zhi: ec.getYearZhi() as Zhi },
    month: { gan: ec.getMonthGan() as Gan, zhi: ec.getMonthZhi() as Zhi },
    day: { gan: ec.getDayGan() as Gan, zhi: ec.getDayZhi() as Zhi },
    hour: { gan: ec.getTimeGan() as Gan, zhi: ec.getTimeZhi() as Zhi },
    sex,
  }
  const shensha = computeShensha(input)
  const shishen = computeShishen(input)

  const base = [
    { label: '年柱', gz: ec.getYear(), gan: input.year.gan, zhi: input.year.zhi, wuxing: ec.getYearWuXing(), nayin: ec.getYearNaYin(), hide: ec.getYearHideGan() },
    { label: '月柱', gz: ec.getMonth(), gan: input.month.gan, zhi: input.month.zhi, wuxing: ec.getMonthWuXing(), nayin: ec.getMonthNaYin(), hide: ec.getMonthHideGan() },
    { label: '日柱', gz: ec.getDay(), gan: input.day.gan, zhi: input.day.zhi, wuxing: ec.getDayWuXing(), nayin: ec.getDayNaYin(), hide: ec.getDayHideGan() },
    { label: '时柱', gz: ec.getTime(), gan: input.hour.gan, zhi: input.hour.zhi, wuxing: ec.getTimeWuXing(), nayin: ec.getTimeNaYin(), hide: ec.getTimeHideGan() },
  ] as const

  const ssKey = ['year', 'month', 'day', 'hour'] as const
  const dayGan = input.day.gan

  const pillars = base.map<Pillar>((p, i) => {
    const ss = shishen.十神[i]
    const hideSs = shishen.藏干十神[i]
    return {
      label: p.label,
      gz: p.gz,
      gan: p.gan,
      zhi: p.zhi,
      ganWuxing: ganWuxing(p.gan),
      zhiWuxing: zhiWuxing(p.zhi),
      wuxing: p.wuxing,
      nayin: p.nayin,
      hideGans: [...p.hide],
      shishen: ss,
      shishenWuxing: shishenWuxing(dayGan, ss),
      hideShishen: hideSs,
      hideShishenWuxings: hideSs.map((s) => shishenWuxing(dayGan, s)),
      shensha: shensha[ssKey[i]],
      zizuo: zizuoState(p.gan, p.zhi),
    }
  })

  if (!hourKnown) pillars[3] = { ...EMPTY_PILLAR }

  return {
    solarStr: hourKnown
      ? solar.toYmdHms()
      : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 时辰未知`,
    trueSolarStr: hourKnown
      ? formatTrueSolar(toTrueSolarDate(year, month, day, hour, minute))
      : '',
    lunarStr: hourKnown
      ? `${lunar.toString()} ${lunar.getTimeZhi()}时`
      : `${lunar.toString()} 时辰未知`,
    pillars,
    hourKnown,
  }
}
