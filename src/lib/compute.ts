/**
 * 八字基础计算：公历→四柱（computeBazi）与干支→四柱（baziToPillars）。
 * 含真太阳时均时差修正小工具。无 store 依赖，纯函数。
 */
import { Solar } from 'lunar-typescript'
import {
  computeShensha,
  computeShishen,
  ganWuxing,
  zhiWuxing,
  zizuoState,
  nayinOf,
  CANG_GAN,
  type Pillar as EnginePillar,
  type Gan,
  type Zhi,
  type Sex,
  type Shishen,
  type WuXing,
} from '@jabberwocky238/bazi-engine'
import type { Pillar, PillarType, BaziResult } from './store'
import {
  HOUR_UNKNOWN,
  EMPTY_PILLAR,
  shishenWuxing,
  type Bazi,
} from './shared'

// ————————————————————————————————————————————————————————
// 真太阳时均时差修正 (按 120°E，不含经度修正)
// ————————————————————————————————————————————————————————

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

// ————————————————————————————————————————————————————————
// computeBazi —— 公历 + 性别 → 四柱
// ————————————————————————————————————————————————————————

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

  const yearP:  EnginePillar = { gan: ec.getYearGan() as Gan,  zhi: ec.getYearZhi()  as Zhi }
  const monthP: EnginePillar = { gan: ec.getMonthGan() as Gan, zhi: ec.getMonthZhi() as Zhi }
  const dayP:   EnginePillar = { gan: ec.getDayGan() as Gan,   zhi: ec.getDayZhi()   as Zhi }
  const hourP:  EnginePillar = { gan: ec.getTimeGan() as Gan,  zhi: ec.getTimeZhi()  as Zhi }

  const shensha = computeShensha(
    [yearP, monthP, dayP, hourKnown ? hourP : undefined],
    sex,
  )
  const dayGan = dayP.gan

  const base = [
    { label: '年柱' as const, p: yearP,  nayin: ec.getYearNaYin(),  hide: ec.getYearHideGan(),  ssKey: 'year'  as const },
    { label: '月柱' as const, p: monthP, nayin: ec.getMonthNaYin(), hide: ec.getMonthHideGan(), ssKey: 'month' as const },
    { label: '日柱' as const, p: dayP,   nayin: ec.getDayNaYin(),   hide: ec.getDayHideGan(),   ssKey: 'day'   as const },
    { label: '时柱' as const, p: hourP,  nayin: ec.getTimeNaYin(),  hide: ec.getTimeHideGan(),  ssKey: 'hour'  as const },
  ]

  const pillars = base.map<Pillar>((b) => {
    const r = computeShishen(dayP, b.p)
    const ss = r.十神
    const hideSs = r.藏干十神
    return {
      label: b.label,
      gan: b.p.gan,
      zhi: b.p.zhi,
      ganWuxing: ganWuxing(b.p.gan),
      zhiWuxing: zhiWuxing(b.p.zhi),
      nayin: b.nayin,
      hideGans: [...b.hide] as Gan[],
      shishen: ss as Shishen,
      shishenWuxing: shishenWuxing(dayGan, ss) as WuXing,
      hideShishen: hideSs,
      hideShishenWuxings: hideSs.map((s) => shishenWuxing(dayGan, s)) as WuXing[],
      shensha: shensha[b.ssKey],
      zizuo: zizuoState(b.p.gan, b.p.zhi),
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

// ————————————————————————————————————————————————————————
// baziToPillars —— 直接由四柱干支构造 Pillar[]，跳过公历/农历计算。
// 用于测试或已知八字直接喂 detector 等场景；神煞依赖四柱干支 + 性别，
// 不依赖具体日期。
// ————————————————————————————————————————————————————————

const PILLAR_LABELS: PillarType[] = ['年柱', '月柱', '日柱', '时柱']
const SS_KEYS = ['year', 'month', 'day', 'hour'] as const

function parseGz(gz: string): EnginePillar {
  if (gz.length !== 2) throw new Error(`bad ganzhi: ${gz}`)
  return { gan: gz[0] as Gan, zhi: gz[1] as Zhi }
}

export function baziToPillars(bazi: Bazi, sex: Sex): Pillar[] {
  const parsed = bazi.map(parseGz) as [EnginePillar, EnginePillar, EnginePillar, EnginePillar]
  const [y, m, d, h] = parsed
  const shensha = computeShensha([y, m, d, h], sex)
  const dayGan = d.gan
  return parsed.map((p, i): Pillar => {
    const r = computeShishen(d, p)
    const ss = r.十神
    const hideSs = r.藏干十神
    return {
      label: PILLAR_LABELS[i]!,
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
      shensha: shensha[SS_KEYS[i]!],
      zizuo: zizuoState(p.gan, p.zhi),
    }
  })
}
