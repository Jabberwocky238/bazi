/**
 * 格局判定入口。
 * 基于 GejuContext (由 BaziInput 直接构造 Calculator) 跑各 detector，
 * detectGejuWith() 为一站式纯函数。
 *
 * 增量迁移中：已铺 正格 (十神格/禄刃格/魁罡) 与 专旺格。
 * v2/正格 暂保留但不再引用。其余 categories detector 仍待迁移。
 */
import { GejuContext, EMPTY_SUIYUN, deriveVisibility } from './types'
import type { Detector, GejuHit, GejuQuality, GejuCategory, DaYunMeta } from './types'
import { isJianLuGe, isYangRenGe } from './categories/禄刃格'
import {
  isZhengGuanGe, isQiShaGe, isShiShenYueLingGe, isShangGuanGe,
  isZhengCaiGe, isPianCaiGe, isZhengYinGe, isPianYinGe,
} from './categories/十神格'
import { isKuiGangGe } from './categories/kuiGangGe'
import { isZhuanWangGe } from './categories/专旺'
import type { BaziDerived } from '../base'
import type { StrengthDerived } from '../strength'
import type { DetailedPillar } from '../base'
import type { BaziInput, Gan, Zhi, Sex } from '@jabberwocky238/bazi-engine'

export type {
  GejuQuality,
  GejuCategory,
  GejuHit,
  GejuSuiyun,
  GejuVisibility,
  DaYunMeta,
  Detector,
} from './types'
export { EMPTY_SUIYUN, deriveVisibility } from './types'

/**
 * 格局检测器表 —— [名称, detector, 质量, 类别]。
 * 名称仅用于互斥等特殊逻辑; 命中名以 detector 返回的 h.name 为准。
 */
export const DETECTORS: Array<[string, Detector, GejuQuality, GejuCategory]> = [
  // 正格: 月令单一十神定格 (透干/有根/三合三会等规则)
  ['建禄格', isJianLuGe, 'good', '正格'],
  ['阳刃格', isYangRenGe, 'good', '正格'],
  ['正官格', isZhengGuanGe, 'good', '正格'],
  ['七杀格', isQiShaGe, 'good', '正格'],
  ['食神格', isShiShenYueLingGe, 'good', '正格'],
  ['伤官格', isShangGuanGe, 'good', '正格'],
  ['正财格', isZhengCaiGe, 'good', '正格'],
  ['偏财格', isPianCaiGe, 'good', '正格'],
  ['正印格', isZhengYinGe, 'good', '正格'],
  ['偏印格', isPianYinGe, 'good', '正格'],
  ['魁罡格', isKuiGangGe, 'good', '正格'],
  // 专旺格: 日主同气专旺 (曲直/炎上/稼穑/从革/润下)
  ['专旺格', isZhuanWangGe, 'good', '专旺格'],
]

export type GejuOutput = GejuHit & { quality: GejuQuality, category: GejuCategory }

/**
 * 由 BaziResult 重建 BaziInput 以构造 GejuContext。
 */
function buildBaziInput(baziDerived: BaziDerived): BaziInput {
  const p = baziDerived.pillars
  const toPillar = (i: number) => ({ gan: p[i].gan.name as Gan, zhi: p[i].zhi.name as Zhi })
  return {
    year: toPillar(0),
    month: toPillar(1),
    day: toPillar(2),
    hour: baziDerived.hourKnown ? toPillar(3) : undefined,
    sex: 1 as Sex,
  }
}

/**
 * 格局判定纯函数。一站式: 重建上下文 → 跑所有 detector → 补齐默认 岁运/显隐。
 */
export function detectGejuWith(
  baziDerived: BaziDerived,
  strengthDerived: StrengthDerived,
  extras?: { dayun?: DetailedPillar; liunian?: DetailedPillar },
): GejuOutput[] {
  // 空排盘 (如初始化 EMPTY_RESULT) 无柱可判。
  if (baziDerived.mainArr.length === 0) return []
  // 正格判定需时柱参与 (透时干/时支有根等规则); 时辰未知时跳过, 避免越界。
  if (!baziDerived.hourKnown) return []

  const ctx = new GejuContext(buildBaziInput(baziDerived), strengthDerived, extras)
  const hits: GejuOutput[] = []
  for (const [, detect, quality, category] of DETECTORS) {
    const h = detect(ctx)
    if (!h) continue
    // detector 可只返回 name/note(/guigeVariant), 在此补齐默认 岁运/显隐。
    const 岁运 = h.岁运 ?? { ...EMPTY_SUIYUN }
    const 显隐 = h.显隐 ?? deriveVisibility(岁运)
    hits.push({
      name: h.name,
      note: h.note,
      岁运,
      显隐,
      ...(h.guigeVariant ? { guigeVariant: h.guigeVariant } : {}),
      quality,
      category,
    })
  }
  return hits
}
