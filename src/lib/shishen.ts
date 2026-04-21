import { Solar } from 'lunar-typescript'
import {
  computeShensha,
  computeShishen,
  ganWuxing,
  zhiWuxing,
  zizuoState,
  nayinOf,
  wuxingRelations,
  ShishenMap,
  CANG_GAN,
  type BaziInput,
  type Gan,
  type Zhi,
  type Sex,
  type Shishen,
  type WuXing,
} from '@jabberwocky238/bazi-engine'

import type { Pillar, PillarType, BaziResult } from './store'

/** 四柱干支字符串元组 (年/月/日/时)，如 `['甲子','己巳','壬子','乙巳']`。 */
export type Bazi = [string, string, string, string]

export const HOUR_UNKNOWN = -1

/** 十神五行 (依日主) — 通过 engine 的 ShishenMap + wuxingRelations 派生。
 *  日主本位/空串/未识别十神统一回空串。 */
export function shishenWuxing(dayGan: string, shishen: string): WuXing | '' {
  if (shishen === '日主') return ganWuxing(dayGan as Gan) ?? ''
  const def = ShishenMap[shishen as Shishen]
  if (!def) return ''
  return wuxingRelations(dayGan as Gan)[def.relation] ?? ''
}

// —— 真太阳时：按均时差修正北京时间 (120°E)，不含经度修正 ——

function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1)
  const d = Date.UTC(year, month - 1, day)
  return Math.floor((d - start) / 86400000) + 1
}

function equationOfTime(year: number, month: number, day: number): number {
  const n = dayOfYear(year, month, day)
  const B = (2 * Math.PI * (n - 81)) / 365
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

function formatTrueSolar(year: number, month: number, day: number, hour: number, minute: number): string {
  const eot = equationOfTime(year, month, day)
  const d = new Date(year, month - 1, day, hour, minute, 0)
  d.setMinutes(d.getMinutes() + Math.round(eot))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${dd} ${hh}:${mm}`
}

// —— 时辰未知时的占位时柱 (UI 应依 hourKnown 跳过渲染) ——
const EMPTY_PILLAR = {
  label: '时柱',
  gan: '',
  zhi: '',
  ganWuxing: '',
  zhiWuxing: '',
  nayin: '',
  hideGans: [],
  shishen: '',
  shishenWuxing: '',
  hideShishen: [],
  hideShishenWuxings: [],
  shensha: [],
  zizuo: '',
} as unknown as Pillar

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
  const dayGan = input.day.gan

  const base = [
    { label: '年柱' as const, gan: input.year.gan, zhi: input.year.zhi, nayin: ec.getYearNaYin(), hide: ec.getYearHideGan(), ssKey: 'year' as const },
    { label: '月柱' as const, gan: input.month.gan, zhi: input.month.zhi, nayin: ec.getMonthNaYin(), hide: ec.getMonthHideGan(), ssKey: 'month' as const },
    { label: '日柱' as const, gan: input.day.gan, zhi: input.day.zhi, nayin: ec.getDayNaYin(), hide: ec.getDayHideGan(), ssKey: 'day' as const },
    { label: '时柱' as const, gan: input.hour.gan, zhi: input.hour.zhi, nayin: ec.getTimeNaYin(), hide: ec.getTimeHideGan(), ssKey: 'hour' as const },
  ]

  const pillars = base.map<Pillar>((p, i) => {
    const ss = shishen.十神[i]
    const hideSs = shishen.藏干十神[i]
    return {
      label: p.label,
      gan: p.gan,
      zhi: p.zhi,
      ganWuxing: ganWuxing(p.gan),
      zhiWuxing: zhiWuxing(p.zhi),
      nayin: p.nayin,
      hideGans: [...p.hide] as Gan[],
      shishen: ss as Shishen,
      shishenWuxing: shishenWuxing(dayGan, ss) as WuXing,
      hideShishen: hideSs,
      hideShishenWuxings: hideSs.map((s) => shishenWuxing(dayGan, s)) as WuXing[],
      shensha: shensha[p.ssKey],
      zizuo: zizuoState(p.gan, p.zhi),
    }
  })

  if (!hourKnown) pillars[3] = EMPTY_PILLAR

  return {
    solarStr: hourKnown
      ? solar.toYmdHms()
      : `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 时辰未知`,
    trueSolarStr: hourKnown ? formatTrueSolar(year, month, day, hour, minute) : '',
    lunarStr: hourKnown
      ? `${lunar.toString()} ${lunar.getTimeZhi()}时`
      : `${lunar.toString()} 时辰未知`,
    pillars,
    hourKnown,
  }
}

// ———— 直接由四柱干支构造 Pillar[] (不需要生日) ————

const PILLAR_LABELS: PillarType[] = ['年柱', '月柱', '日柱', '时柱']
const SS_KEYS = ['year', 'month', 'day', 'hour'] as const

function parseGz(gz: string): { gan: Gan; zhi: Zhi } {
  if (gz.length !== 2) throw new Error(`bad ganzhi: ${gz}`)
  return { gan: gz[0] as Gan, zhi: gz[1] as Zhi }
}

/**
 * 直接由四柱干支 + 性别构造 Pillar[]，跳过公历/农历计算。
 * 用于测试或已知八字直接喂进 detector 等场景；神煞依赖四柱干支 + 性别，不依赖具体日期。
 */
export function baziToPillars(bazi: Bazi, sex: Sex): Pillar[] {
  const parsed = bazi.map(parseGz) as [
    { gan: Gan; zhi: Zhi }, { gan: Gan; zhi: Zhi },
    { gan: Gan; zhi: Zhi }, { gan: Gan; zhi: Zhi },
  ]
  const [y, m, d, h] = parsed
  const input: BaziInput = { year: y, month: m, day: d, hour: h, sex }
  const shishen = computeShishen(input)
  const shensha = computeShensha(input)
  const dayGan = d.gan
  return parsed.map((p, i): Pillar => {
    const ss = shishen.十神[i]
    const hideSs = shishen.藏干十神[i]
    return {
      label: PILLAR_LABELS[i],
      gan: p.gan,
      zhi: p.zhi,
      ganWuxing: ganWuxing(p.gan),
      zhiWuxing: zhiWuxing(p.zhi),
      nayin: nayinOf(p.gan, p.zhi),
      hideGans: [...CANG_GAN[p.zhi]] as Gan[],
      shishen: ss as Shishen,
      shishenWuxing: shishenWuxing(dayGan, ss) as WuXing,
      hideShishen: hideSs,
      hideShishenWuxings: hideSs.map((s) => shishenWuxing(dayGan, s)) as WuXing[],
      shensha: shensha[SS_KEYS[i]],
      zizuo: zizuoState(p.gan, p.zhi),
    }
  })
}
