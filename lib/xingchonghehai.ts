// @ts-nocheck — 暂时跳过类型检查 (待迁移/待修复 engine 重构)
/**
 * 合冲刑害 · extras (大运/流年/流月) 引化分析。
 *
 * 岁运柱直接交给 engine analyzeGanZhi；engine 已在各 finding 上挂载
 * dissolved / impacted / opened 等状态。本层只保留前端需要的兼容包装。
 */
import {
  analyzeGanZhi,
  pairwiseGan,
  pairwiseZhi,
  type Pillar as EnginePillar,
  type ExtraPillar as EngineExtraPillar,
  type Finding,
  type FindingKind,
  type GanZhiAnalysis,
  type WuXing,
  type Gan,
  type Zhi,
} from '@jabberwocky238/bazi-engine'

// ————————————————————————————————————————————————————————
// 类型
// ————————————————————————————————————————————————————————

export type ExtraSourceLabel = '大运' | '流年' | '流月'

export interface ExtraGanZhiInput {
  label: ExtraSourceLabel
  gan: Gan
  zhi: Zhi
}

export type ExtraInteractionKind =
  | '六合' | '半三合' | '半三会'
  | '六冲' | '六害' | '六破' | '相刑' | '自刑'
  | '天干五合' | '天干相克'

export interface ExtraInteraction {
  kind: ExtraInteractionKind
  source: { label: ExtraSourceLabel; gz: string }
  /** 与命局哪柱关联。 */
  target: '年' | '月' | '日' | '时'
  targetGz: string
  huaWx?: WuXing
  note: string
}

export interface DissolvedMark {
  /** 原 finding 的 kind，用于显示分类。 */
  kind: FindingKind
  /** 原 finding 的 name，用于在 UI 中匹配。 */
  name: string
  /** 由谁引化。 */
  by: { label: ExtraSourceLabel; gz: string; via: string }
}

export interface GanZhiWithExtras {
  base: GanZhiAnalysis
  /** engine 暂未导出 extras × 主柱的独立两两关系；不在此层重写影子表。 */
  extra: ExtraInteraction[]
  /** 原局冲/刑/害/破/克被 extras 引化（按 base finding.name 匹配）。 */
  dissolved: DissolvedMark[]
}

// ————————————————————————————————————————————————————————
// 主入口
// ————————————————————————————————————————————————————————

export function analyzeGanZhiWithExtras(
  pillars: EnginePillar[],
  extras: ExtraGanZhiInput[],
): GanZhiWithExtras | null {
  const engineExtras: EngineExtraPillar[] = extras
  const base = analyzeGanZhi(pillars, engineExtras)
  if (!base) return null

  const extra: ExtraInteraction[] = []
  for (const e of engineExtras) {
    for (let i = 0; i < pillars.length && i < 4; i++) {
      const p = pillars[i]
      if (!p?.gan || !p?.zhi) continue
      for (const hit of [pairwiseGan(e.gan, p.gan), pairwiseZhi(e.zhi, p.zhi)]) {
        if (!hit) continue
        extra.push({
          kind: hit.kind,
          source: { label: e.label as ExtraSourceLabel, gz: `${e.gan}${e.zhi}` },
          target: ['年', '月', '日', '时'][i] as ExtraInteraction['target'],
          targetGz: `${p.gan}${p.zhi}`,
          note: hit.note,
        })
      }
    }
  }

  const dissolved: DissolvedMark[] = []
  for (const list of Object.values(base)) {
    if (!Array.isArray(list)) continue
    for (const f of list as Finding[]) {
      if (!('dissolved' in f) || !f.dissolved?.length) continue
      for (const mod of f.dissolved) {
        dissolved.push({
          kind: f.kind,
          name: f.name,
          by: {
            label: mod.by.label as ExtraSourceLabel,
            gz: `${mod.by.gan}${mod.by.zhi}`,
            via: mod.via,
          },
        })
      }
    }
  }

  return { base, extra, dissolved }
}
