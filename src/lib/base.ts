import type { SkillCategory } from './skills'
import Calculator from '@jabberwocky238/bazi-engine/calculator'
import type {
  PillarType,
  Gan,
  Zhi,
  WuXing,
  Shishen,
  ShishenCat,
  Season,
  Sex,
  BaziInput,
} from '@jabberwocky238/bazi-engine'

export type { Gan, Zhi, WuXing, Shishen, ShishenCat, Season, PillarType, BaziInput }
import type { DetailedPillar } from '@jabberwocky238/bazi-engine/calculator'

export type Pillar = DetailedPillar

export type BaziResult = {
  // 基础信息
  solarStr: string
  trueSolarStr: string
  lunarStr: string
  pillars: DetailedPillar[]
  hourKnown: boolean

  // BaziDerived 合并字段
  dayGan: Gan | ''
  dayZhi: Zhi | ''
  dayGz: string
  dayWx: WuXing | ''
  dayYang: boolean
  yearZhi: Zhi | ''
  monthZhi: Zhi | ''
  season: Season | ''
  monthCat: ShishenCat | ''
  monthZhiBeingChong: boolean
  mainArr: DetailedPillar[]
  ganSet: Set<Gan>
}

export interface SkillFocus {
  category: SkillCategory
  name: string
  subtitle?: string
}

/** 时辰未知占位 (BaziInputState.hour 取这个值即代表"时柱未知")。 */
export const HOUR_UNKNOWN = -1

/** 十神 → 类别映射（依 engine ShishenMap 派生）。 */
import { ShishenMap, ganWuxing, wuxingRelations, seasonOf } from '@jabberwocky238/bazi-engine'

export const SHI_SHEN_CAT: Record<Shishen | string, ShishenCat> = Object.fromEntries(
  Object.entries(ShishenMap).map(([name, def]) => [name, def.category]),
) as Record<Shishen | string, ShishenCat>

/** 地支六冲对。 */
export const CHONG_PAIR: Record<string, string> = {
  子: '午', 午: '子', 卯: '酉', 酉: '卯',
  寅: '申', 申: '寅', 巳: '亥', 亥: '巳',
  辰: '戌', 戌: '辰', 丑: '未', 未: '丑',
}

/** 阳干集合 (甲/丙/戊/庚/壬)。 */
export const YANG_GANS: ReadonlySet<string> = new Set(['甲', '丙', '戊', '庚', '壬'])

/**
 * 十神五行 (依日主) — 通过 engine 的 ShishenMap + wuxingRelations 派生。
 * 日主本位/空串/未识别十神统一回空串。
 */
export function shishenWuxing(dayGan: string, shishen: string): WuXing | '' {
  if (shishen === '日主') return ganWuxing(dayGan as Gan) ?? ''
  const def = ShishenMap[shishen as Shishen]
  if (!def) return ''
  return wuxingRelations(dayGan as Gan)[def.relation] ?? ''
}

/** 时辰未知时的占位时柱 (UI 应依 hourKnown 跳过渲染)。 */
export const EMPTY_PILLAR: DetailedPillar = {
  label: '时柱' as PillarType,
  gan: { name: '', wuxing: '', shishen: '' },
  zhi: { name: '', wuxing: '', cangGan: [] },
  nayin: '',
  shensha: [],
  changsheng: '',
} as unknown as DetailedPillar

/** 空排盘结果占位 */
export const EMPTY_RESULT: BaziResult = {
  solarStr: '',
  trueSolarStr: '',
  lunarStr: '',
  pillars: [],
  hourKnown: false,
  dayGan: '',
  dayZhi: '',
  dayGz: '',
  dayWx: '',
  dayYang: false,
  yearZhi: '',
  monthZhi: '',
  season: '',
  monthCat: '',
  monthZhiBeingChong: false,
  mainArr: [],
  ganSet: new Set(),
}

/** 填充派生命段到 BaziResult */
export function fillDerivedFields(result: {
  solarStr: string
  trueSolarStr: string
  lunarStr: string
  pillars: DetailedPillar[]
  hourKnown: boolean
}): BaziResult {
  const yearPillar = result.pillars[0]
  const monthPillar = result.pillars[1]
  const dayPillar = result.pillars[2]
  const hourPillar = result.pillars[3]

  const dayGan = dayPillar?.gan?.name ?? ''
  const dayZhi = dayPillar?.zhi?.name ?? ''
  const dayGz = dayGan && dayZhi ? `${dayGan}${dayZhi}` : ''
  const dayWx = dayPillar?.gan?.wuxing ?? ''
  const dayYang = YANG_GANS.has(dayGan)
  const yearZhi = yearPillar?.zhi?.name ?? ''
  const monthZhi = monthPillar?.zhi?.name ?? ''
  const season: Season | '' = monthZhi ? (seasonOf(monthZhi as Zhi) ?? '') : ''
  const monthCat = monthPillar?.gan?.shishen ? (SHI_SHEN_CAT[monthPillar.gan.shishen] ?? '') : ''
  const monthZhiBeingChong = CHONG_PAIR[monthZhi] === (dayPillar?.zhi?.name ?? '')
  const mainArr = result.pillars.slice()
  const ganSet = new Set(result.pillars.map((p) => p.gan.name).filter(Boolean) as Gan[])

  return {
    ...result,
    dayGan: dayGan as Gan | '',
    dayZhi: dayZhi as Zhi | '',
    dayGz,
    dayWx: dayWx as WuXing | '',
    dayYang,
    yearZhi: yearZhi as Zhi | '',
    monthZhi: monthZhi as Zhi | '',
    season,
    monthCat: monthCat as ShishenCat | '',
    monthZhiBeingChong,
    mainArr,
    ganSet,
  }
}

