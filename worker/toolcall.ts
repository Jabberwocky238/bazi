// ————————————————————————————————————————————————————————
// Tool 注册器 —— 统一管理可被 LLM 调用的工具 (function calling)。
// 与 OpenAI tool-calling 协议对齐, 但不依赖 openai sdk, 可独立复用/测试。
//
// 非全局化: 通过构造器实例化, 注入外部 KV (Cloudflare KV binding) + 请求级 context。
// context 按 JSON 内容做稳定 hash (SHA-256), 并写入 KV (key=hash), 供工具按 hash 取回。
//
// 用法:
//   // toolbox.ts: import { tools } from './toolcall'; tools.push(tool({...}))
//   const registry = new ToolRegistry({ kv: env.KV, context, request })
//   await registry.init()                      // 计算 context hash 并存入 KV
//   client.chat.completions.create({ ..., tools: registry.toOpenAITools() })
//   收到 tool_calls → registry.call(name, arguments) → 回灌 role:'tool'
//
// execute 内可通过 ctx 拿到: kv + context + contextKey + request。
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

/** 构造参数: 注入外部 KV + 请求级 context。 */
export interface ToolRegistryOptions {
  kv?: ToolKV
  context?: Record<string, unknown>
  request?: Request
}

/** 稳定 JSON 序列化: 递归排序对象 key, 保证相同内容 → 相同字符串 → 相同 hash。 */
function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`
  const obj = v as Record<string, unknown>
  const keys = Object.keys(obj).sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`
}

/** SHA-256 hex (Web Crypto, CF Worker 原生可用)。 */
async function sha256Hex(s: string): Promise<string> {
  const data = new TextEncoder().encode(s)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** 对任意可 JSON 化的对象做稳定 hash。 */
export async function hashContext(context: unknown): Promise<string> {
  return sha256Hex(stableStringify(context))
}

/** KV 中存 context 的 key 前缀。 */
export const CONTEXT_KV_PREFIX = 'ctx:'

/**
 * 全局工具注册表 —— 模块级数组, 各处 (toolbox.ts) import 后直接 push 定义。
 * ToolRegistry 构造时引用此数组, 无需 register/registerAll。
 */
export const tools: Tool[] = []

export class ToolRegistry {
  private readonly ctx: ToolContext

  constructor(options: ToolRegistryOptions = {}) {
    this.ctx = {
      kv: options.kv,
      context: options.context,
      request: options.request,
    }
  }

  /**
   * 初始化: 对 context 做稳定 hash, 并 (若注入了 kv) 把 context 原文写入 KV。
   * 之后 ctx.contextKey 可用, 工具可经 `kv.get('ctx:'+contextKey)` 取回完整 context。
   * @returns this (便于链式)
   */
  async init(): Promise<this> {
    if (this.ctx.context) {
      const hash = await hashContext(this.ctx.context)
      this.ctx.contextKey = hash
      if (this.ctx.kv) {
        await this.ctx.kv.put(`${CONTEXT_KV_PREFIX}${hash}`, JSON.stringify(this.ctx.context))
      }
    }
    return this
  }

  /** 当前 context hash (init 后可用)。 */
  get contextKey(): string | undefined {
    return this.ctx.contextKey
  }

  /** 按名取工具定义 (从全局 tools 数组)。 */
  private find(name: string): Tool | undefined {
    for (const t of tools) if (t.name === name) return t
    return undefined
  }

  /** 列出所有工具名。 */
  names(): string[] {
    return tools.map((t) => t.name)
  }

  /** 转为 OpenAI tools 参数格式 (供 chat.completions.create 的 tools 字段); 按 name 去重。 */
  toOpenAITools(): OpenAIToolSchema[] {
    const seen = new Set<string>()
    const out: OpenAIToolSchema[] = []
    for (const t of tools) {
      if (seen.has(t.name)) continue
      seen.add(t.name)
      out.push({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })
    }
    return out
  }

  /**
   * 调用工具。执行时把构造器注入的 ctx (kv + context + contextKey + request) 透传给 execute。
   * @param name 工具名
   * @param args 模型给的原始 JSON 字符串或已解析对象
   * @returns 工具结果字符串; 工具不存在 / 参数非法 / 执行抛错时返回 `{error}` JSON
   */
  async call(
    name: string,
    args: string | Record<string, unknown>,
  ): Promise<string> {
    const def = this.find(name)
    if (!def) {
      return JSON.stringify({ error: `Unknown tool: ${name}` })
    }

    let parsed: Record<string, unknown>
    if (typeof args === 'string') {
      try {
        parsed = args.trim() === '' ? {} : JSON.parse(args)
      } catch {
        return JSON.stringify({ error: `Invalid JSON args for ${name}` })
      }
    } else {
      parsed = args
    }

    try {
      return await def.execute(parsed, this.ctx)
    } catch (e) {
      return JSON.stringify({
        error: `Tool ${name} failed: ${e instanceof Error ? e.message : String(e)}`,
      })
    }
  }
}
