import { tool, type Tool, type ToolContext } from '../tooldef'
import { analyzeGanZhi } from '@jabberwocky238/bazi-engine'
import { Calculator, BaziInputC, PillarC, parseGz2, type Sex, type Pillar } from './_helpers'

/**
 * ganzhi_relation —— 用 engine 的 Calculator + analyzeGanZhi 计算整个命盘
 * (四柱) 与当前选中大运的全部干支关系。
 * 自动从请求头注入的 ctx 取:
 *   - basics.bazi → 四柱干支
 *   - ui.dayun    → 选中大运干支 (作为 extras 参与合冲刑害破)
 * analyzeGanZhi 一次性返回: 天干五合/相冲/相克, 地支六合/三合/三会/暗合/相冲/相刑/相破/相害,
 * 墓库, 以及每柱盖头截脚覆载。无参数。
 */
export const ganzhiRelation: Tool = tool({
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
      const calc = new Calculator(BaziInputC.from({
        year: parseGz2(y) as Pillar,
        month: parseGz2(m) as Pillar,
        day: parseGz2(d) as Pillar,
        hour: hourKnown ? parseGz2(h) as Pillar : undefined,
        sex,
      }))
      // 四柱裸 Pillar —— analyzeGanZhi 第一参吃字面量形式 (1.2.0: bazi 是 BaziInputC)
      const pillars: Pillar[] = [
        calc.bazi.year, calc.bazi.month, calc.bazi.day, calc.bazi.hour,
      ]
        .filter((p): p is PillarC => !!p)
        .map((p) => ({ gan: p.gan.str, zhi: p.zhi.str }))

      // 选中大运作为 extras (1.2.0: extras 是 PillarC[]; pillarType 仅做标记)
      const extras: PillarC[] = (ui?.dayun ?? [])
        .map((d) => d.gz)
        .filter((g): g is string => !!g && g.length === 2)
        .map((g) => {
          const p = parseGz2(g)!
          return PillarC.from(p.gan, p.zhi, '大运')
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
