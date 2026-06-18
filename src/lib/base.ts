import type { SkillCategory } from './skills'
import {Calculator} from '@jabberwocky238/bazi-engine'
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

export type { Gan, Zhi, WuXing, Shishen, ShishenCat, Season, PillarType, BaziInput, Sex }
import type { DetailedPillar } from '@jabberwocky238/bazi-engine'

// 注意：engine 的 Pillar 是 { gan: Gan, zhi: Zhi } 简单结构
// 而 DetailedPillar 是包含 { name, wuxing, shishen } 的详细结构
export type Pillar = DetailedPillar
export type { DetailedPillar }

// 为兼容前端旧代码，扩展 DetailedPillar 添加衍生字段
// 在 fillDerivedFields 或相关函数中需要填充这些字段
export interface ExtendedDetailedPillar extends DetailedPillar {
  // 十神快捷访问（与 gan.shishen 一致，方便旧代码）
  shishen: Shishen | '日主' | ''
  shishenWuxing: WuXing | ''
  // 五行快捷访问（与 gan.wuxing / zhi.wuxing 一致）
  ganWuxing: WuXing | ''
  zhiWuxing: WuXing | ''
  // 隐藏标记（用于格局判定时临时隐藏某柱）
  hideGans: Gan[]
  hideShishen: Shishen[]
  hideShishenWuxings: WuXing[]
  // 自坐（天干在地支的状态）
  zizuo: string
}

// 兼容旧代码的 BaziDerived 名称，实际就是 BaziResult
export type BaziDerived = BaziResult

export type BaziResult = {
  // 基础信息
  solarStr: string
  trueSolarStr: string
  lunarStr: string
  pillars: ExtendedDetailedPillar[]
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
  mainArr: ExtendedDetailedPillar[]
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
export const EMPTY_PILLAR: ExtendedDetailedPillar = {
  label: '时柱' as PillarType,
  gan: { name: '', wuxing: '', shishen: '' },
  zhi: { name: '', wuxing: '', cangGan: [] },
  nayin: '',
  shensha: [],
  changsheng: '',
  shishen: '',
  shishenWuxing: '',
  ganWuxing: '',
  zhiWuxing: '',
  hideGans: [],
  hideShishen: [],
  hideShishenWuxings: [],
  zizuo: '',
} as unknown as ExtendedDetailedPillar

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

/** 四柱占位 (年/月/日/时)，label 各异，用于无有效排盘时渲染空表，避免 key 重复。 */
export function emptyPillars(): ExtendedDetailedPillar[] {
  return (['年柱', '月柱', '日柱', '时柱'] as PillarType[]).map((label) => ({
    ...EMPTY_PILLAR,
    label,
  }))
}

/** 填充派生命段到 BaziResult，并为每个 pillar 添加扩展字段 */
export function fillDerivedFields(result: {
  solarStr: string
  trueSolarStr: string
  lunarStr: string
  pillars: DetailedPillar[]
  hourKnown: boolean
}): BaziResult {
  // 为每个 pillar 添加扩展字段，兼容旧代码访问方式
  const pillars = result.pillars.map((p) => ({
    ...p,
    // 十神快捷访问
    shishen: p.gan.shishen,
    shishenWuxing: p.gan.wuxing,
    // 五行快捷访问
    ganWuxing: p.gan.wuxing,
    zhiWuxing: p.zhi.wuxing,
    // 隐藏标记默认值
    hideGans: p.zhi.cangGan.map(c => c.name as Gan),
    hideShishen: p.zhi.cangGan.map(c => c.shishen),
    hideShishenWuxings: p.zhi.cangGan.map(c => c.wuxing),
    // 自坐（简化实现，后续可完善）
    zizuo: `${p.gan.name}坐${p.zhi.name}`,
  })) as ExtendedDetailedPillar[]

  const yearPillar = pillars[0]
  const monthPillar = pillars[1]
  const dayPillar = pillars[2]
  const hourPillar = pillars[3]

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
  const mainArr = pillars.slice()
  const ganSet = new Set(pillars.map((p) => p.gan.name).filter(Boolean) as Gan[])

  return {
    ...result,
    pillars,
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

