import { tool, type Tool, type ToolContext } from '../tooldef'
import { deriveFromCtx } from './_helpers'
import { evalGeju } from '../../src/components/stores/geju'

/** geju_analysis —— 格局分析 (正格/外格/特殊格, 含岁运显隐)。 */
export const gejuAnalysis: Tool = tool({
  name: 'geju_analysis',
  description:
    '格局分析: 检测命盘所成格局(如七杀格/正印格/杀印相生/食神生财/专旺格/从格等), 含岁运引化显隐。' +
    '无需传参, 自动取当前命盘八字与选中大运。',
  parameters: { type: 'object', properties: {}, additionalProperties: false },
  async execute(_args, ctx: ToolContext) {
    const { derived, pillars, dayun, error } = deriveFromCtx(ctx)
    if (!derived || !pillars) return JSON.stringify({ error })
    const { hits } = evalGeju(pillars, derived, dayun ? { dayun } : {})
    return JSON.stringify(
      hits.map((h) => ({
        name: h.name,
        category: h.category,
        成: h.成,
        ...(h.破.length > 0 ? { 岁运破: h.破.map((r) => r.why) } : {}),
      })),
    )
  },
})
