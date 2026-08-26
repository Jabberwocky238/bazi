/**
 * 格局求值层。bazilib/geju 只出声明 (RULES / GEJU / RuleC), 求值在这里。
 *
 * 一个原局进去 → 全部 rule 的判定表出来; 格局命中与缺口都是该表的投影,
 * 不是另算一遍。
 */
import { BaziInputC, Calculator, type PillarC } from '@jabberwocky238/bazi-engine'
import {
  GEJU,
  RULES,
  type Ctx,
  type GejuCategory,
  type Pillar,
  type RuleId,
  type StrengthDerived,
} from 'bazilib'

/** 岁运柱 —— 大运 / 流年。 */
export type GejuExtras = { dayun?: Pillar; liunian?: Pillar }

/** 一条 rule 在两域下的判定。 */
export type RuleVerdict = {
  id: RuleId
  /** 失败时的说法。 */
  why: string
  /** 静态条件岁运不可补。 */
  静态: boolean
  主局: boolean
  /** 主局 + 岁运; 无岁运或静态条件时等同 主局。 */
  岁运: boolean
}

/** 一个格局的判定 —— 由 rule 表投影而来。 */
export type GejuVerdict = {
  name: string
  category: GejuCategory
  /** 主局是否全条成立。 */
  成: boolean
  /** 加岁运后是否全条成立。 */
  岁运成: boolean
  /** 主局失败的条 —— 差什么。 */
  缺: RuleVerdict[]
  /** 主局成立而岁运不成立的条 —— 岁运破格。 */
  破: RuleVerdict[]
  /** 静态失败 —— 命局本身不可能成。 */
  fatal: RuleVerdict[]
  /** 主局失败但岁运补得上。 */
  pending: RuleVerdict[]
  /** 两域皆败 —— 因它才不成，岁运也没救。 */
  blocking: RuleVerdict[]
}

export type GejuResult = {
  /** 全部 rule 的判定表 —— 唯一状态。 */
  rules: Record<RuleId, RuleVerdict>
  /** 11 个格局的判定, 由 rules 投影。 */
  geju: GejuVerdict[]
  /** 已成格的格局 (主局成, 或岁运补成)。 */
  hits: GejuVerdict[]
  hasExtras: boolean
}

function toCtx(pillars: Pillar[], strength: StrengthDerived, extras: PillarC[]): Ctx {
  const gz = (i: number) => ({
    gan: pillars[i].pillar.gan.str,
    zhi: pillars[i].pillar.zhi.str,
  })
  const calc = new Calculator(
    BaziInputC.from({ year: gz(0), month: gz(1), day: gz(2), hour: gz(3), sex: 1 }),
  )
  return { calc, extras, strength }
}

function extraPillars(e: GejuExtras): PillarC[] {
  const out: PillarC[] = []
  if (e.dayun) out.push(e.dayun.pillar)
  if (e.liunian) out.push(e.liunian.pillar)
  return out
}

const EMPTY: GejuResult = {
  rules: {} as Record<RuleId, RuleVerdict>,
  geju: [],
  hits: [],
  hasExtras: false,
}

/**
 * 全量求值。时辰未知时不判 (正格需时柱参与)。
 */
export function evalGeju(
  pillars: Pillar[],
  strength: StrengthDerived,
  extras: GejuExtras = {},
): GejuResult {
  if (pillars.length !== 4) return EMPTY

  const ex = extraPillars(extras)
  const hasExtras = ex.length > 0
  const 主局 = toCtx(pillars, strength, [])
  const 岁运 = hasExtras ? toCtx(pillars, strength, ex) : null

  // 1) 全部 rule 各求一次 —— 这是唯一状态。
  const rules = {} as Record<RuleId, RuleVerdict>
  for (const id of Object.keys(RULES) as RuleId[]) {
    const r = RULES[id]
    const a = r.test(主局)
    rules[id] = {
      id,
      why: r.why,
      静态: r.静态,
      主局: a,
      岁运: r.静态 || !岁运 ? a : r.test(岁运),
    }
  }

  // 2) 格局 = rule 表的投影。
  const geju = Object.values(GEJU).map((g): GejuVerdict => {
    const evals = g.rules.map((id) => rules[id])
    const 缺 = evals.filter((e) => !e.主局)
    const 动 = 缺.filter((e) => !e.静态)
    return {
      name: g.name,
      category: g.category,
      成: 缺.length === 0,
      岁运成: evals.every((e) => e.岁运),
      缺,
      破: evals.filter((e) => e.主局 && !e.岁运),
      fatal: 缺.filter((e) => e.静态),
      pending: 动.filter((e) => e.岁运),
      blocking: 动.filter((e) => !e.岁运),
    }
  })

  return {
    rules,
    geju,
    hits: geju.filter((g) => g.成 || (hasExtras && g.岁运成)),
    hasExtras,
  }
}
