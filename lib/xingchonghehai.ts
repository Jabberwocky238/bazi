/**
 * 合冲刑害 · extras (大运/流年/流月) 引化分析。
 *
 * engine 1.2.0 把干支关系统一收成 GanZhiAnalysis.{天干, 地支, 子集, 争合, 整柱},
 * 每条命中裹在 SuiYunHit 里 (hit + mods + dissolved + impacted);
 * 本层只做两件事:
 *   ① 摊平成前端按类分组要的形状 (合/冲/刑/害/破/暗合/克 各一组)
 *   ② 补 extras × 原局 的两两关系 (engine 的 analyze 只标注岁运对原局关系的作用,
 *      不单列"岁运某柱与原局某柱成了什么关系", 故这里用 pairGan/pairZhi 枚举)
 *
 * 墓库与解法直接透传 engine 的 GanZhiCalculator 结果, 不再自行判定。
 */
import {
  Calculator,
  BaziInputC,
  PillarC,
  GanC,
  ZhiC,
  type Pillar as EnginePillar,
  type DiZhiHit,
  type GanZhiAnalysis,
  type MuKuVerdict,
  type RemedySet,
  type Sex,
  type SuiYunHit,
  type SuiYunMod,
  type TianGanHit,
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
  | '六合' | '三合' | '三会' | '暗合'
  | '相冲' | '相害' | '相破' | '相刑'
  | '相合' | '相克'

export interface ExtraInteraction {
  kind: ExtraInteractionKind
  source: { label: ExtraSourceLabel; gz: string }
  /** 与命局哪柱关联。 */
  target: '年' | '月' | '日' | '时'
  targetGz: string
  huaWx?: WuXing
  note: string
}

/** 岁运对某条原局关系的作用 (引化/冲克/加重/助合)。 */
export interface FindingMod {
  effect: SuiYunMod['effect']
  /** 由哪个岁运柱触发。 */
  by: { label: string; gz: string }
  /** 经由哪条关系触发。 */
  via: string
}

/** 摊平后的一条关系 —— UI 直接渲染的形状。 */
export interface FlatFinding {
  /** 关系类别 (相冲 / 六合 / 三合 ...)。 */
  kind: string
  /** 全名 ("子午相冲")。 */
  name: string
  /** 涉及柱位, 如 "年月"; 岁运柱记作 运/年/月。 */
  positions: string
  /** 是否紧贴 (相邻柱)。 */
  close: boolean
  /** 被岁运引化。 */
  dissolved: FindingMod[]
  /** 被岁运冲克。 */
  impacted: FindingMod[]
  note: string
}

export interface GanZhiWithExtras {
  /** 按类分组的原局 (+岁运入列) 关系。 */
  groups: {
    合: FlatFinding[]
    冲: FlatFinding[]
    刑: FlatFinding[]
    害: FlatFinding[]
    破克暗合: FlatFinding[]
  }
  /** 墓库判定 (engine GanZhiCalculator.muku)。 */
  muku: readonly MuKuVerdict[]
  /** 每条关系的解法 (engine 反推 dissolvers/breakers)。 */
  remedies: readonly RemedySet[]
  /** extras × 原局 的两两关系。 */
  extra: ExtraInteraction[]
  /** 原局关系被 extras 引化的汇总。 */
  dissolved: Array<{ kind: string; name: string; by: FindingMod['by'] & { via: string } }>
}

// ————————————————————————————————————————————————————————
// 摊平
// ————————————————————————————————————————————————————————

/** 柱下标 → 标签; 0-3 为原局年月日时, 4+ 为依次入列的岁运柱。 */
function slotLabel(i: number, extraLabels: string[]): string {
  const origin = ['年', '月', '日', '时']
  if (i < 4) return origin[i] ?? String(i)
  return extraLabels[i - 4] ?? '运'
}

function toMods(mods: readonly SuiYunMod[], want: SuiYunMod['effect'][]): FindingMod[] {
  return mods
    .filter((m) => want.includes(m.effect))
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
  const positions = slots.map((i) => slotLabel(i, extraLabels)).join('')
  // 紧贴: 命中柱下标连续 (差 1)
  const close = slots.length >= 2 && slots.every((s, i) => i === 0 || s - slots[i - 1]! === 1)
  return {
    kind: h.hit.kind,
    name: h.hit.name,
    positions,
    close,
    dissolved: toMods(h.mods, ['引化']),
    impacted: toMods(h.mods, ['冲克']),
    note: '',
  }
}

// ————————————————————————————————————————————————————————
// 主入口
// ————————————————————————————————————————————————————————

export function analyzeGanZhiWithExtras(
  pillars: EnginePillar[],
  extras: ExtraGanZhiInput[],
  sex: Sex = 1,
): GanZhiWithExtras | null {
  if (pillars.length < 4) return null
  const [y, m, d, h] = pillars
  if (!y || !m || !d || !h) return null

  const input = BaziInputC.from({ year: y, month: m, day: d, hour: h, sex })
  const calc = new Calculator(input)
  const gz = calc.ganzhi()

  const extraPillars = extras.map((e) => PillarC.from(e.gan, e.zhi, e.label))
  const extraLabels = extras.map((e) => e.label)

  const a: GanZhiAnalysis | null = gz.analyze(extraPillars)
  if (!a) return null

  const ganHits = a.天干.map((x) => flatten(x, extraLabels))
  const zhiHits = a.地支.map((x) => flatten(x, extraLabels))
  const all = [...ganHits, ...zhiHits]
  const byKind = (...kinds: string[]) => all.filter((f) => kinds.includes(f.kind))

  const groups = {
    合: byKind('相合', '六合', '三合', '三会'),
    冲: byKind('相冲'),
    刑: byKind('相刑'),
    害: byKind('相害'),
    破克暗合: byKind('相破', '相克', '暗合'),
  }

  // extras × 原局 两两关系 (engine 不单列, 用 pairGan/pairZhi 枚举)
  const extra: ExtraInteraction[] = []
  const originLabels: ExtraInteraction['target'][] = ['年', '月', '日', '时']
  for (const e of extras) {
    for (let i = 0; i < 4; i++) {
      const p = pillars[i]
      if (!p) continue
      const g = gz.pairGan(GanC.from(e.gan), GanC.from(p.gan as Gan))
      const z = gz.pairZhi(ZhiC.from(e.zhi), ZhiC.from(p.zhi as Zhi))
      for (const hit of [g, z]) {
        if (!hit) continue
        extra.push({
          kind: hit.kind as ExtraInteractionKind,
          source: { label: e.label, gz: `${e.gan}${e.zhi}` },
          target: originLabels[i]!,
          targetGz: `${p.gan}${p.zhi}`,
          note: hit.name,
        })
      }
    }
  }

  const dissolved = all.flatMap((f) =>
    f.dissolved.map((mod) => ({ kind: f.kind, name: f.name, by: { ...mod.by, via: mod.via } })),
  )

  return {
    groups,
    // muku / remedies 开销较大 (穷举解法), 用惰性 getter 按需计算,
    // 不访问就不算 —— 随机对拍等只看 groups 的场景零成本。
    get muku() { return gz.muku(extraPillars) },
    get remedies() { return gz.remedies(extraPillars) },
    extra,
    dissolved,
  }
}
