import type { Calculator, PillarC } from '@jabberwocky238/bazi-engine'
import type { StrengthDerived } from '../strength'

/**
 * 规则求值上下文。
 * `extras` 为岁运柱 (大运/流年); 空数组即主局域。
 */
export type Ctx = {
  calc: Calculator
  extras: PillarC[]
  strength: StrengthDerived
}

/** 复合规则的算子; 叶子规则为 null。 */
export type RuleOp = 'not' | 'and' | 'or'

/**
 * 一条成格条件。
 * 叶子规则由 `RuleC.from` 造; 复合规则由 not/and/or/implies 算子组合而来,
 * 并保留 `op` 与 `operands` 以便诊断时展开到叶子。
 */
export class RuleC {
  private constructor(
    readonly test: (c: Ctx) => boolean,
    readonly why: string,
    readonly 静态: boolean,
    /** 复合算子; 叶子为 null。 */
    readonly op: RuleOp | null,
    /** 算子的操作数; 叶子为空。诊断据此展开到叶子。 */
    readonly operands: readonly RuleC[],
  ) {}

  static from(spec: { test: (c: Ctx) => boolean; why: string; 静态?: boolean }): RuleC {
    return new RuleC(spec.test, spec.why, spec.静态 ?? false, null, [])
  }

  /** 复合规则; 静态性由操作数继承 —— 全部静态才静态。 */
  private static compose(
    op: RuleOp,
    operands: readonly RuleC[],
    test: (c: Ctx) => boolean,
    why: string,
  ): RuleC {
    return new RuleC(test, why, operands.every((r) => r.静态), op, operands)
  }

  /** 取反。why 由调用方给，因为「非 X」的失败说法不是「X」的否定句。 */
  not(why: string): RuleC {
    return RuleC.compose('not', [this], (c) => !this.test(c), why)
  }

  and(rest: RuleC, why: string): RuleC {
    const operands = [this, rest]
    return RuleC.compose('and', operands, (c) => operands.every((r) => r.test(c)), why)
  }

  or(rest: RuleC, why: string): RuleC {
    const operands = [this, rest]
    return RuleC.compose('or', operands, (c) => operands.some((r) => r.test(c)), why)
  }

  /** this → rest，即 ¬this ∨ rest。对应规范里的「除非」句式。 */
  implies(rest: RuleC, why: string): RuleC {
    return RuleC.compose('or', [this.not(why), rest], (c) => !this.test(c) || rest.test(c), why)
  }

  /** 展开到叶子; 叶子返回自身。诊断按此逐条报。 */
  get leaves(): readonly RuleC[] {
    return this.op === null ? [this] : this.operands.flatMap((r) => r.leaves)
  }
}

/** 格局类别 —— 决定 UI 分组与配色。 */
export type GejuCategory = '从格' | '十神格' | '五行格' | '专旺格' | '特殊格' | '正格'

/**
 * 一个格局 —— 名字 + 成格条件的 id 列表。规则本体存于 RULES。
 * `Id` 由调用方绑成 RuleId，故列表里写错 id 是编译错误。
 */
export class GejuC<Id extends string = string> {
  private constructor(
    readonly name: string,
    readonly rules: readonly Id[],
    readonly category: GejuCategory,
  ) {}

  static from<Id extends string>(spec: {
    name: string
    rules: readonly Id[]
    category: GejuCategory
  }): GejuC<Id> {
    return new GejuC(spec.name, spec.rules, spec.category)
  }
}

/**
 * 岁运段 —— 聚合与大运/流年判定相关的状态。
 */
export interface GejuSuiyun {
  /** 该判定本身是否为岁运特定。 */
  isSuiyun: boolean
  /** 原局不成格，岁运补齐成格。 */
  Trigger: boolean
  /** 原局成格，岁运破格。 */
  Break: boolean
  /** 默认成格。 */
  DefaultTrigger: boolean
  /** 岁运冲害。 */
  Conquer: boolean
}

export const EMPTY_SUIYUN: GejuSuiyun = {
  isSuiyun: false,
  Trigger: false,
  Break: false,
  DefaultTrigger: false,
  Conquer: false,
}

/** 显 = 已成格当前可见；隐 = 仅潜在（岁运依赖且未默认成 / 未触发）。 */
export type GejuVisibility = '显' | '隐'

/** 由 岁运 段派生 显隐：仅 isSuiyun 而无 DefaultTrigger / Trigger 撑起时为隐。 */
export function deriveVisibility(s: GejuSuiyun): GejuVisibility {
  if (s.isSuiyun && !s.DefaultTrigger && !s.Trigger) return '隐'
  return '显'
}

/** 一条规则的双域求值结果。 */
export type RuleEval = {
  id: string
  rule: RuleC
  /** 主局域是否成立。 */
  主局: boolean
  /** 主局 + 岁运域是否成立；静态规则等同 主局。 */
  岁运: boolean
}

/**
 * 缺口 —— 未成格时「差什么」的三分。
 * fatal 不计入 missing：静态条件命局本身不可能补，距离无穷远。
 */
export type Gap = {
  /** 静态条件失败 —— 命局本身不可能成，岁运无用。 */
  fatal: RuleEval[]
  /** 主局失败但岁运域成立 —— 岁运补得上。 */
  pending: RuleEval[]
  /** 两域皆败 —— 因它才无法成格，岁运也没救。 */
  blocking: RuleEval[]
  /** 还差几条 (blocking + pending)。 */
  missing: number
}

/** 大运序列相对命局的配合度元信息。 */
export interface DaYunMeta {
  forward: boolean
  favorableStreak: number
  avoidStreak: number
}
