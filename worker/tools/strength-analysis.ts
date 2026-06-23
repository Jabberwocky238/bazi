import { tool, type Tool, type ToolContext } from '../tooldef'
import { deriveFromCtx } from './_helpers'

/** strength_analysis —— 身强弱分析 (根气/印比党势/得令得地, 综合判定身强身弱)。 */
export const strengthAnalysis: Tool = tool({
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
