import { tool, type Tool } from '../tooldef'

// —— 基础工具 ——
// ping —— 原样回显, 用于验证多轮 tool-calling 链路。
// (要求模型连续调用四次以压测多 tool_call 并发处理)

export const ping: Tool<{ message?: string }> = tool({
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
