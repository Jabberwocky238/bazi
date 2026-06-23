import { tool, type Tool, type ToolContext } from '../tooldef'
import { deriveFromCtx } from './_helpers'

/** xiyong_analysis —— 喜用神分析 (扶抑/调候/通关/救应, 给出喜用与忌避五行)。 */
export const xiyongAnalysis: Tool = tool({
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
