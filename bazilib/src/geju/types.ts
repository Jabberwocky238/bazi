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

/**
 * 一个格局 —— 名字 + 成格条件的 id 列表。规则本体存于 RULES。
 * `Id` 由调用方绑成 RuleId，故列表里写错 id 是编译错误。
 */
export class GejuC<Id extends string = string> {
  private constructor(
    readonly name: string,
    readonly rules: readonly Id[],
  ) {}

  static from<Id extends string>(name: string, rules: readonly Id[]): GejuC<Id> {
    return new GejuC(name, rules)
  }
}
