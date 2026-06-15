/**
 * 公历 → 八字 与 干支 → 八字 的计算逻辑。lib/ 只关心 (Pillar, Sex);
 * 涉及公历 / 农历 / 真太阳时 的所有日历换算放在 stores 这层。
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
import {
  HOUR_UNKNOWN,
  EMPTY_PILLAR,
  shishenWuxing,
  type Bazi,
  type Pillar,
  type PillarType,
  type BaziResult,
} from '@/lib'

// ————————————————————————————————————————————————————————
// 真太阳时均时差修正 (按 120°E, 不含经度修正)
// ————————————————————————————————————————————————————————

function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1)
  const d = Date.UTC(year, month - 1, day)
  return Math.floor((d - start) / 86400000) + 1
}

/** 均时差(分钟). 公历→真太阳时使用. 仅靠太阳轨道, 不含经度修正. */
export function equationOfTime(year: number, month: number, day: number): number {
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
// computeBazi —— 公历 + 性别 → BaziResult
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
  // sect=1: 23:00 即换日 (早子换日派)
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
// baziToPillars —— 直接由 4 干支构造 Pillar[]; 跳过公历/农历计算。
// 神煞依赖四柱干支 + 性别, 不依赖具体日期。
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

// ————————————————————————————————————————————————————————
// computeFromState — 输入 state (mode + dates / longitude / bazi / sex) 一站式
// 返回 BaziResult; 大运由调用方按需另算 (本函数纯, 无 store 写入).
// 主盘 pushBazi 与 合盘 共享此函数, 0 复刻.
// ————————————————————————————————————————————————————————

import type { BaziInputMode } from './bazi'

export interface BaziInputData {
  mode: BaziInputMode
  year: number
  month: number
  day: number
  hour: number
  minute: number
  longitude: number
  bazi: [string, string, string, string]
  sex: Sex
}

function fmtDate(y: number, m: number, d: number, h: number, mi: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(mi)}`
}

/**
 * 输入 state → BaziResult (含 mode-specific 显示标注 + 真太阳时调整后的有效日期).
 * 同时返回经过修正的 (year, month, day, hour, minute) 用于调用方算大运 (主盘需要).
 */
export interface ComputedFromState {
  bazi: BaziResult
  /** 修正后的年月日时分 — 主盘用来算大运. 八字直输模式下为 null. */
  effectiveDate: { year: number; month: number; day: number; hour: number; minute: number } | null
}

export function computeFromState(s: BaziInputData): ComputedFromState | null {
  if (s.mode === 'bazi') {
    const valid = s.bazi.slice(0, 3).every((g) => g.length === 2)
    if (!valid) return null
    const hourGz = s.bazi[3]
    const hourKnown = hourGz.length === 2
    try {
      const fullBazi: Bazi = [
        s.bazi[0], s.bazi[1], s.bazi[2],
        hourKnown ? hourGz : '甲子',
      ]
      const pillars = baziToPillars(fullBazi, s.sex)
      if (!hourKnown) pillars[3] = EMPTY_PILLAR
      return {
        bazi: {
          solarStr: '',
          trueSolarStr: '',
          lunarStr: `八字直输 ${s.bazi.filter((g) => g.length === 2).join(' ')}`,
          pillars,
          hourKnown,
        },
        effectiveDate: null,
      }
    } catch (e) {
      console.warn('[bazi-mode] 解析失败:', e)
      return null
    }
  }

  let { year, month, day, hour, minute } = s
  let trueSolarStr = ''
  let solarStr = ''
  const hourKnown = hour !== HOUR_UNKNOWN && hour >= 0 && hour < 24

  if (s.mode === 'gregorianLong' && hourKnown) {
    const eot = equationOfTime(year, month, day)
    const longShift = (s.longitude - 120) * 4
    const total = Math.round(eot + longShift)
    const d = new Date(year, month - 1, day, hour, minute, 0)
    d.setMinutes(d.getMinutes() + total)
    solarStr = fmtDate(year, month, day, hour, minute)
    year = d.getFullYear()
    month = d.getMonth() + 1
    day = d.getDate()
    hour = d.getHours()
    minute = d.getMinutes()
    trueSolarStr = fmtDate(year, month, day, hour, minute)
  } else if (s.mode === 'trueSolar' && hourKnown) {
    trueSolarStr = fmtDate(year, month, day, hour, minute)
  }

  const r = computeBazi(year, month, day, hour, minute, s.sex)
  if (s.mode === 'gregorianLong' && solarStr) {
    r.solarStr = `${solarStr} (公历)`
    r.trueSolarStr = `${trueSolarStr} (真太阳时)`
  } else if (s.mode === 'trueSolar' && trueSolarStr) {
    r.trueSolarStr = `${trueSolarStr} (输入即真太阳时, 未再做均时差)`
  }

  return {
    bazi: r,
    effectiveDate: { year, month, day, hour, minute },
  }
}
