import { tool, type Tool, type ToolContext } from '../tooldef'
import { deriveFromCtx } from './_helpers'

/** geju_analysis —— 格局分析 (正格/外格/特殊格, 含岁运显隐)。 */
export const gejuAnalysis: Tool = tool({
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
