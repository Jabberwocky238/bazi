// ————————————————————————————————————————————————————————
// Tool 定义原语 —— 纯类型 + `tool` 构造辅助, 无任何项目内依赖 (叶子模块)。
// 独立出来避免 toolcall.ts ↔ ./tools 之间的循环依赖:
//   tool 文件只 import 本模块, 不再 import toolcall.ts → 无环。
// toolcall.ts 负责聚合 ./tools 并注册到全局 tools 数组。
// ————————————————————————————————————————————————————————

/** JSON Schema (简化), 用于描述工具参数, 透传给模型。 */
export interface ToolParameters {
  type: 'object'
  properties: Record<string, unknown>
  required?: string[]
  additionalProperties?: boolean
  [key: string]: unknown
}

/**
 * 外部 KV —— Cloudflare KV binding (KVNamespace 的最小子集)。
 * 仅用 get/put 文本接口; 真实 KVNamespace 满足此形状。
 */
export interface ToolKV {
  get(key: string): Promise<string | null | undefined> | string | null | undefined
  put(key: string, value: string): Promise<unknown>
}

/** 请求级上下文: 构造时注入, 每个请求一份。 */
export interface ToolContext {
  /** 外部 KV 绑定 (可选)。 */
  kv?: ToolKV
  /** 请求里带的初始化参数 (八字上下文等)。 */
  context?: Record<string, unknown>
  /** context 的 JSON hash (SHA-256 hex), init() 后可用; KV 中以 `ctx:<hash>` 存原文。 */
  contextKey?: string
  /** 原始请求。 */
  request?: Request
}

/**
 * 单个工具定义。
 * TArgs 为执行参数的静态类型; 运行时由模型给出的 JSON 解析而来, 需在 execute 内自行校验。
 * execute 返回 string —— 即回灌给模型的 tool 结果内容。
 */
export interface Tool<TArgs = Record<string, unknown>> {
  name: string
  description: string
  parameters: ToolParameters
  execute: (args: TArgs, ctx: ToolContext) => Promise<string> | string
}

/** OpenAI tool-calling 协议中的工具描述 (tools 字段元素)。 */
export interface OpenAIToolSchema {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: ToolParameters
  }
}

/** 工具构造辅助函数, 让 TArgs 自动从 execute 签名推断。 */
export function tool<TArgs extends Record<string, unknown>>(
  def: Tool<TArgs>,
): Tool<TArgs> {
  return def
}
