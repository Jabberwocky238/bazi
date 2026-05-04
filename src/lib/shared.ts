/**
 * 跨文件共享的基础常量与小工具。
 * 不包含 store / 计算逻辑，仅常量与纯函数。
 */
import {
  ShishenMap,
  ganWuxing,
  wuxingRelations,
  type Gan,
  type Shishen,
  type ShishenCat,
  type WuXing,
} from '@jabberwocky238/bazi-engine'
import type { Pillar } from './store'

/** 时辰未知占位 (BaziInputState.hour 取这个值即代表"时柱未知")。 */
export const HOUR_UNKNOWN = -1

/** 四柱干支字符串元组 (年/月/日/时)，如 `['甲子','己巳','壬子','乙巳']`。 */
export type Bazi = [string, string, string, string]

/** 十神 → 类别映射（依 engine ShishenMap 派生）。 */
export const SHI_SHEN_CAT: Record<string, ShishenCat> = Object.fromEntries(
  Object.entries(ShishenMap).map(([name, def]) => [name, def.category]),
) as Record<string, ShishenCat>

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
export const EMPTY_PILLAR: Pillar = {
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
