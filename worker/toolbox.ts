import { tool, tools, type Tool, type ToolContext } from './toolcall'
import {
  Calculator,
  analyzeGanZhi,
  computeShishenGan,
  computeShishenZhi,
  computeShishenWuxing,
  CANG_GAN,
  ganWuxing,
  zhiWuxing,
  nayinOf,
  changshengState,
  type Gan,
  type Zhi,
  type Sex,
  type Pillar,
  type ExtraPillar,
  type DetailedPillar,
} from '@jabberwocky238/bazi-engine'
import {
  parseBaziToResult,
  deriveAll,
  type BaziResult,
} from '@/lib'

// ————————————————————————————————————————————————————————
// 工具箱 —— 集中定义所有可被 LLM 调用的工具, push 进 toolcall.ts 的全局 tools 数组。
// chat.ts 只需 `import './toolbox'` (副作用) 即完成注册。
//
// 添加新工具: 在下方写一个 tool({...}), 然后 tools.push(it)。
// ————————————————————————————————————————————————————————

// —— 基础工具 ——
// ping —— 原样回显, 用于验证多轮 tool-calling 链路。
// (要求模型连续调用四次以压测多 tool_call 并发处理)

const ping: Tool<{ message?: string }> = tool({
  name: 'ping',
  description:
    '健康检查工具。回显传入的 message, 用于验证多轮工具调用链路。' +
    '重要: 每次使用此工具时, 必须在同一轮里连续调用四次 ' +
    '(分别带上不同的 message, 如 "1/4"、"2/4"、"3/4"、"4/4"), 以压测多 tool_call 并发处理。',
  parameters: {
    type: 'object',
    properties: {
      message: { type: 'string', description: '要回显的文本' },
    },
    additionalProperties: false,
  },
  async execute(args) {
    await new Promise((r) => setTimeout(r, 1000))
    return JSON.stringify({ pong: args.message ?? '' })
  },
})

// —— 八字命理工具 ——

/** "甲子" → { gan:"甲", zhi:"子" }。 */
function parseGz(gz: string): { gan: Gan; zhi: Zhi } {
  if (gz.length !== 2) throw new Error(`bad ganzhi: ${gz}`)
  return { gan: gz[0] as Gan, zhi: gz[1] as Zhi }
}

/**
 * compute_pillars —— 根据八字四柱 + 性别计算四柱详情。
 * 输入可省略: 不传时从请求头注入的 ctx.context.basics 取 (bazi + sex)。
 * 返回每柱的 干支 / 五行 / 十神 / 藏干(含十神五行) / 纳音 / 神煞 / 长生。
 */
const computePillars: Tool<{
  bazi?: string[]
  sex?: number
}> = tool({
  name: 'compute_pillars',
  description:
    '根据八字四柱干支与性别计算四柱详情(天干/地支的五行、十神、藏干、纳音、神煞、十二长生)。' +
    '可不传参数: 缺省时自动用当前命盘的八字与性别(来自请求头 X-BAZI-BASICS)。',
  parameters: {
    type: 'object',
    properties: {
      bazi: {
        type: 'array',
        items: { type: 'string' },
        description: '四柱干支, 如 ["甲子","丙寅","戊午","庚申"]; 时柱未知时为空串。',
      },
      sex: { type: 'integer', description: '性别: 1 男 / 0 女' },
    },
    additionalProperties: false,
  },
  async execute(args, ctx: ToolContext) {
    // 参数缺省 → 回退到请求头注入的 basics
    const basics = (ctx.context as { basics?: { bazi?: string[]; sex?: number } } | undefined)?.basics
    const bazi = args.bazi ?? basics?.bazi
    const sex = (args.sex ?? basics?.sex ?? 1) as Sex
    if (!bazi || bazi.length < 3) {
      return JSON.stringify({ error: '需要至少年月日三柱八字 (或当前命盘未提供)' })
    }
    const [y, m, d, h = ''] = bazi
    const hourKnown = h.length === 2
    try {
      const calc = new Calculator(
        {
          year: parseGz(y),
          month: parseGz(m),
          day: parseGz(d),
          hour: hourKnown ? parseGz(h) : undefined,
          sex,
        },
        sex,
      )
      return JSON.stringify(calc.pillars())
    } catch (e) {
      return JSON.stringify({ error: `计算失败: ${e instanceof Error ? e.message : String(e)}` })
    }
  },
})

// —— 干支关系工具 ——

/** "甲子" → { gan:"甲", zhi:"子" }; 非法返回 null。 */
function parseGz2(gz: string): { gan: Gan; zhi: Zhi } | null {
  const t = gz.trim()
  if (t.length !== 2) return null
  const g = t[0]!
  const z = t[1]!
  // 合法性交由 Calculator 校验, 这里只做长度判断
  return { gan: g as Gan, zhi: z as Zhi }
}

/**
 * ganzhi_relation —— 用 engine 的 Calculator + analyzeGanZhi 计算整个命盘
 * (四柱) 与当前选中大运的全部干支关系。
 * 自动从请求头注入的 ctx 取:
 *   - basics.bazi → 四柱干支
 *   - ui.dayun    → 选中大运干支 (作为 extras 参与合冲刑害破)
 * analyzeGanZhi 一次性返回: 天干五合/相冲/相克, 地支六合/三合/三会/暗合/相冲/相刑/相破/相害,
 * 墓库, 以及每柱盖头截脚覆载。无参数。
 */
const ganzhiRelation: Tool = tool({
  name: 'ganzhi_relation',
  description:
    '根据当前命盘四柱 + 选中大运, 用引擎一次性计算全部干支关系: ' +
    '天干五合/相冲/相克, 地支六合/三合/三会/暗合/相冲/相刑/相破/相害, 墓库, 各柱盖头截脚覆载。' +
    '无需传参, 自动取请求头里的八字与选中大运。',
  parameters: {
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  async execute(_args, ctx: ToolContext) {
    const basics = (ctx.context as { basics?: { bazi?: string[]; sex?: number } } | undefined)?.basics
    const ui = (ctx.context as { ui?: { dayun?: Array<{ gz?: string }> } } | undefined)?.ui
    const bazi = basics?.bazi ?? []
    if (bazi.length < 3) {
      return JSON.stringify({ error: '当前命盘不足三柱, 无法计算关系' })
    }
    const sex = (basics?.sex ?? 1) as Sex

    try {
      // 用 Calculator 构造四柱 Pillar (校验干支合法性 + 补时柱未知)
      const [y, m, d, h = ''] = bazi
      const hourKnown = h.length === 2
      const calc = new Calculator(
        {
          year: parseGz2(y) as Pillar,
          month: parseGz2(m) as Pillar,
          day: parseGz2(d) as Pillar,
          hour: hourKnown ? parseGz2(h) as Pillar : undefined,
          sex,
        },
        sex,
      )
      // 四柱 Pillar (engine 原始 {gan,zhi} 结构)
      const pillars: Pillar[] = calc.bazi.year && calc.bazi.month && calc.bazi.day
        ? [calc.bazi.year, calc.bazi.month, calc.bazi.day, calc.bazi.hour!].filter(Boolean) as Pillar[]
        : []

      // 选中大运作为 extras (label 用 '时柱' 占位也行, 但更准确用引擎 PillarType;
      // analyzeGanZhi 内部只用 gan/zhi, label 仅做标记, 此处用 '流年' 之类无实际影响)
      const extras: ExtraPillar[] = (ui?.dayun ?? [])
        .map((d) => d.gz)
        .filter((g): g is string => !!g && g.length === 2)
        .map((g) => {
          const p = parseGz2(g)!
          return { label: '流年' as never, gan: p.gan, zhi: p.zhi }
        })

      if (pillars.length !== 4) {
        return JSON.stringify({ error: '四柱不全, analyzeGanZhi 需 4 柱' })
      }
      const analysis = analyzeGanZhi(pillars, extras)
      if (!analysis) {
        return JSON.stringify({ error: '分析失败' })
      }
      return JSON.stringify(analysis)
    } catch (e) {
      return JSON.stringify({ error: `计算失败: ${e instanceof Error ? e.message : String(e)}` })
    }
  },
})

// —— 身强弱 / 喜用神 / 格局 工具 (复用 src/lib 的 analyzeStrength / analyzeXiyong / detectGejuWith) ——

/** 把单个干支字符串构造成 engine DetailedPillar (供 gejuExtras 用), 需日主定十神。 */
function gzToDetailedPillar(gz: string, dayGan: Gan): DetailedPillar | null {
  const p = parseGz2(gz)
  if (!p) return null
  const cangGanSs = computeShishenZhi(dayGan, p.zhi)
  return {
    label: '时柱' as never,
    gan: {
      name: p.gan,
      wuxing: ganWuxing(p.gan),
      shishen: computeShishenGan(dayGan, p.gan),
    },
    zhi: {
      name: p.zhi,
      wuxing: zhiWuxing(p.zhi),
      cangGan: CANG_GAN[p.zhi].map((g, idx) => ({
        name: g,
        shishen: cangGanSs[idx]!,
        wuxing: computeShishenWuxing(dayGan, cangGanSs[idx]!),
      })),
    },
    nayin: nayinOf(p.gan, p.zhi),
    shensha: [],
    changsheng: changshengState(p.gan, p.zhi),
  } as DetailedPillar
}

/**
 * 从 ctx 取八字 + 选中大运, 一站式 deriveAll:
 * 返回 { baziResult, derived, dayunPillars } 供三个分析工具复用。
 */
function deriveFromCtx(ctx: ToolContext): {
  derived: ReturnType<typeof deriveAll> | null
  error?: string
} {
  const basics = (ctx.context as { basics?: { bazi?: string[]; sex?: number } } | undefined)?.basics
  const ui = (ctx.context as { ui?: { dayun?: Array<{ gz?: string }> } } | undefined)?.ui
  const bazi = basics?.bazi ?? []
  if (bazi.length < 3 || !bazi.slice(0, 3).every((g) => g && g.length === 2)) {
    return { derived: null, error: '当前命盘八字不足三柱' }
  }
  const sex = (basics?.sex ?? 1) as Sex
  try {
    const r: BaziResult = parseBaziToResult(
      [bazi[0]!, bazi[1]!, bazi[2]!, bazi[3] ?? ''] as [string, string, string, string],
      sex,
    )
    if (!r.pillars || r.pillars.length !== 4) {
      return { derived: null, error: '排盘失败, 四柱不全' }
    }
    const dayGan = r.dayGan as Gan
    // 选中大运 → DetailedPillar, 作 gejuExtras 参与格局岁运判定
    const dayunPillar = (ui?.dayun ?? [])
      .map((d) => d.gz)
      .filter((g): g is string => !!g && g.length === 2)
      .map((g) => gzToDetailedPillar(g, dayGan))
      .find((p): p is DetailedPillar => !!p)
    const derived = deriveAll(r, dayunPillar ? { dayun: dayunPillar } : {})
    return { derived }
  } catch (e) {
    return { derived: null, error: `排盘/派生失败: ${e instanceof Error ? e.message : String(e)}` }
  }
}

/** strength_analysis —— 身强弱分析 (根气/印比党势/得令得地, 综合判定身强身弱)。 */
const strengthAnalysis: Tool = tool({
  name: 'strength_analysis',
  description:
    '身强弱分析: 依据日主在四柱的根气(地支藏干)、印比党势、得令得地, 综合判定身强/身弱/身中及偏强偏弱。' +
    '无需传参, 自动取当前命盘八字。',
  parameters: { type: 'object', properties: {}, additionalProperties: false },
  async execute(_args, ctx: ToolContext) {
    const { derived, error } = deriveFromCtx(ctx)
    if (!derived) return JSON.stringify({ error })
    return JSON.stringify(derived.analysis ?? { error: '身强弱分析为空' })
  },
})

/** xiyong_analysis —— 喜用神分析 (扶抑/调候/通关/救应, 给出喜用与忌避五行)。 */
const xiyongAnalysis: Tool = tool({
  name: 'xiyong_analysis',
  description:
    '喜用神分析: 综合扶抑/调候/通关/救应, 给出病根、喜用五行(主/次)与忌避五行。' +
    '无需传参, 自动取当前命盘八字与选中大运。',
  parameters: { type: 'object', properties: {}, additionalProperties: false },
  async execute(_args, ctx: ToolContext) {
    const { derived, error } = deriveFromCtx(ctx)
    if (!derived) return JSON.stringify({ error })
    return JSON.stringify(derived.xiyongAnalysis ?? { error: '喜用神分析为空' })
  },
})

/** geju_analysis —— 格局分析 (正格/外格/特殊格, 含岁运显隐)。 */
const gejuAnalysis: Tool = tool({
  name: 'geju_analysis',
  description:
    '格局分析: 检测命盘所成格局(如七杀格/正印格/杀印相生/食神生财/专旺格/从格等), 含岁运引化显隐。' +
    '无需传参, 自动取当前命盘八字与选中大运。',
  parameters: { type: 'object', properties: {}, additionalProperties: false },
  async execute(_args, ctx: ToolContext) {
    const { derived, error } = deriveFromCtx(ctx)
    if (!derived) return JSON.stringify({ error })
    return JSON.stringify(derived.gejuHits ?? [])
  },
})

// —— 注册到全局 tools 数组 (chat.ts 经副作用 import './toolbox' 触发) ——
// 幂等: 模块可能被多次求值 (HMR / 多环境), 按 name 去重避免 OpenAI "Tool names must be unique"。
for (const t of [ping, computePillars, ganzhiRelation, strengthAnalysis, xiyongAnalysis, gejuAnalysis]) {
  if (!tools.some((x) => x.name === t.name)) tools.push(t)
}
