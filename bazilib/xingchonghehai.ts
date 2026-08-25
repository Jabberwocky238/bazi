/**
 * 合冲刑害 —— engine GanZhiCalculator 的薄适配层。
 *
 * 关系判定全部由 engine 完成: 岁运柱作为 extras 一并入列 analyze(),
 * 命中的 slots 里自带岁运柱下标 (原局 0-3, 岁运 4+), 岁运对原局关系的
 * 引化/冲克记在 mods 上。半合/拱合/拱会 由 analyze().子集 给出。
 *
 * 本层只做一件事: 把 SuiYunHit 摊平成 UI 直接渲染的形状 (按类分组 + 柱位串)。
 * 墓库与解法直接透传, 不做二次判定。
 */
import {
  Calculator,
  BaziInputC,
  PillarC,
  ORIGIN_PILLAR_LABELS,
  type Pillar as EnginePillar,
  type DiZhiHit,
  type MuKuVerdict,
  type RemedySet,
  type Sex,
  type SuiYunHit,
  type SuiYunMod,
  type TianGanHit,
  type Gan,
  type Zhi,
} from '@jabberwocky238/bazi-engine'

export type ExtraSourceLabel = '大运' | '流年' | '流月'

export interface ExtraGanZhiInput {
  label: ExtraSourceLabel
  gan: Gan
  zhi: Zhi
}

/** 岁运对某条原局关系的作用 (引化 / 冲克 / 加重 / 助合)。 */
export interface FindingMod {
  effect: SuiYunMod['effect']
  by: { label: string; gz: string }
  via: string
}

/** 摊平后的一条关系 —— UI 直接渲染的形状。 */
export interface FlatFinding {
  /** 关系类别 (相冲 / 六合 / 三合 ...)。 */
  kind: string
  /** 全名 ("子午相冲")。 */
  name: string
  /** 涉及柱位串, 如 "年月"; 岁运柱记其标签首字。 */
  positions: string
  /** 是否紧贴 (命中柱下标连续)。 */
  close: boolean
  /** 是否含岁运柱 (slots 有 ≥4 者)。 */
  hasExtra: boolean
  /** 子集名目 (半合 / 拱合 / 拱会); 整局命中时无。 */
  sub?: string
  dissolved: FindingMod[]
  impacted: FindingMod[]
}

export interface GanZhiWithExtras {
  /** 按类分组的关系 (原局 + 岁运已一并入列)。 */
  groups: {
    合: FlatFinding[]
    冲: FlatFinding[]
    刑: FlatFinding[]
    害: FlatFinding[]
    破克暗合: FlatFinding[]
  }
  /** 三合/三会 的两支子集 (半合 / 拱合 / 拱会)。 */
  subsets: FlatFinding[]
  /** 墓库判定 (engine GanZhiCalculator.muku)。 */
  muku: readonly MuKuVerdict[]
  /** 每条关系的解法 (engine 反推 dissolvers / breakers)。 */
  remedies: readonly RemedySet[]
}

/** 柱下标 → 标签首字; 0-3 为原局年月日时, 4+ 为依次入列的岁运柱。 */
function slotLabel(i: number, extraLabels: string[]): string {
  return i < 4
    ? (ORIGIN_PILLAR_LABELS[i]?.[0] ?? String(i))
    : (extraLabels[i - 4]?.[0] ?? '运')
}

function toMods(mods: readonly SuiYunMod[], want: SuiYunMod['effect']): FindingMod[] {
  return mods
    .filter((m) => m.effect === want)
    .map((m) => ({
      effect: m.effect,
      by: { label: m.by.pillarType ?? '岁运', gz: `${m.by.gan.str}${m.by.zhi.str}` },
      via: m.via,
    }))
}

function flatten(
  h: SuiYunHit<DiZhiHit> | SuiYunHit<TianGanHit>,
  extraLabels: string[],
): FlatFinding {
  const slots = h.hit.slots
  return {
    kind: h.hit.kind,
    name: h.hit.name,
    positions: slots.map((i) => slotLabel(i, extraLabels)).join(''),
    close: slots.length >= 2 && slots.every((s, i) => i === 0 || s - slots[i - 1]! === 1),
    hasExtra: slots.some((s) => s >= 4),
    dissolved: toMods(h.mods, '引化'),
    impacted: toMods(h.mods, '冲克'),
  }
}

export function analyzeGanZhiWithExtras(
  pillars: EnginePillar[],
  extras: ExtraGanZhiInput[],
  sex: Sex = 1,
): GanZhiWithExtras | null {
  const [y, m, d, h] = pillars
  if (!y || !m || !d || !h) return null

  const gz = new Calculator(BaziInputC.from({ year: y, month: m, day: d, hour: h, sex })).ganzhi()
  const extraPillars = extras.map((e) => PillarC.from(e.gan, e.zhi, e.label))
  const extraLabels = extras.map((e) => e.label)

  const a = gz.analyze(extraPillars)
  if (!a) return null

  const all = [...a.天干, ...a.地支].map((x) => flatten(x, extraLabels))
  const byKind = (...kinds: string[]) => all.filter((f) => kinds.includes(f.kind))

  return {
    groups: {
      合: byKind('相合', '六合', '三合', '三会'),
      冲: byKind('相冲'),
      刑: byKind('相刑'),
      害: byKind('相害'),
      破克暗合: byKind('相破', '相克', '暗合'),
    },
    // 半合 / 拱合 / 拱会 —— engine 单列, 不必自行用 pairwise 枚举
    subsets: a.子集.map((s) => ({
      kind: '子集',
      name: s.name,
      positions: s.slots.map((i) => slotLabel(i, extraLabels)).join(''),
      close: s.slots.length >= 2 && s.slots.every((v, i) => i === 0 || v - s.slots[i - 1]! === 1),
      hasExtra: s.slots.some((v) => v >= 4),
      sub: s.sub,
      dissolved: [],
      impacted: [],
    })),
    // muku / remedies 开销较大 (穷举解法), 惰性求值 —— 不访问就不算。
    get muku() { return gz.muku(extraPillars) },
    get remedies() { return gz.remedies(extraPillars) },
  }
}
