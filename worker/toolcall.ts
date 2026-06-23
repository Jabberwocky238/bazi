// ————————————————————————————————————————————————————————
// Tool 注册器 —— 统一管理可被 LLM 调用的工具 (function calling)。
// 与 OpenAI tool-calling 协议对齐, 但不依赖 openai sdk, 可独立复用/测试。
//
// 非全局化: 通过构造器实例化, 注入外部 KV (Cloudflare KV binding) + 请求级 context。
// context 按 JSON 内容做稳定 hash (SHA-256), 并写入 KV (key=hash), 供工具按 hash 取回。
//
// 用法:
//   // 各工具定义在 ./tools/*.ts (仅逻辑), 本文件负责聚合 + 注册到全局 tools 数组。
//   const registry = new ToolRegistry({ kv: env.KV, context, request })
//   await registry.init()                      // 计算 context hash 并存入 KV
//   client.chat.completions.create({ ..., tools: registry.toOpenAITools() })
//   收到 tool_calls → registry.call(name, arguments) → 回灌 role:'tool'
//
// execute 内可通过 ctx 拿到: kv + context + contextKey + request。
// ————————————————————————————————————————————————————————

// 工具定义原语 (类型 + tool 辅助) —— 见 tooldef.ts (叶子模块, 避免循环依赖)。
export {
  tool,
  type Tool,
  type ToolParameters,
  type ToolKV,
  type ToolContext,
  type OpenAIToolSchema,
} from './tooldef'
import type {
  Tool,
  ToolParameters,
  ToolKV,
  ToolContext,
  OpenAIToolSchema,
} from './tooldef'

// 工具定义 (仅逻辑) —— 各 ./tools/*.ts 导出 Tool; 这里集中聚合后注册。
import { allTools } from './tools'

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

// —— 注册: 把 ./tools 聚合的工具 push 进全局 tools 数组。 ——
// 幂等: 模块可能被多次求值 (HMR / 多环境), 按 name 去重避免 OpenAI "Tool names must be unique"。
// chat.ts 经副作用 `import './toolcall'` (或被其 import 的模块) 触发本注册。
for (const t of allTools) {
  if (!tools.some((x) => x.name === t.name)) tools.push(t)
}

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
