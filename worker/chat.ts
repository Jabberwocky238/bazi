import OpenAI from 'openai'
import { ToolRegistry, type ToolKV } from './toolcall'
import './toolbox' // 副作用: 把工具 push 进全局 tools 数组

/**
 * 聊天后端 —— OpenAI (兼容端点) 流式 SSE + 多轮 tool-calling。
 *
 * 仅使用 Web 标准 Request/Response + openai sdk, 适配 Cloudflare Worker。
 *
 * 请求: POST, body `{ messages: { role, content }[] }`
 * 响应: text/event-stream
 *   - 文本增量: `data: {"content":"..."}\n\n`
 *   - 工具调用开始: `data: {"toolStart":{"name":"...","args":...}}\n\n`
 *   - 工具调用完成: `data: {"toolEnd":{"name":"...","result":"..."}}\n\n`
 *   - 结束: `data: [DONE]\n\n`
 *   出错时 (如未配置 key) 返回普通 JSON `{ error }`。
 *
 * 多轮循环: 模型若返回 tool_calls, 则逐个执行 (registry.call), 把结果以
 * role:'tool' 回灌消息列表后重新发起请求, 直到模型给出最终文本或达到轮数上限。
 *
 * 环境变量:
 *   OPENAI_API_KEY   必填, 走 wrangler secret / .dev.vars
 *   OPENAI_BASE_URL  可选, 兼容端点; 默认官方
 *   OPENAI_MODEL     可选, 默认 gpt-4o-mini
 */

export interface ChatEnv {
  OPENAI_API_KEY?: string
  OPENAI_BASE_URL?: string
  OPENAI_MODEL?: string
  /** Cloudflare KV binding —— 存工具 context (按 hash 索引)。 */
  KV?: ToolKV
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * X-BAZI-BASICS 头内容 —— 八字命盘的最小必要信息。
 * store 在后端不可见, 故由前端经请求头显式传递; 五行/十神/日主等派生项一律砍掉,
 * 由后端/工具从八字自行推算。
 */
interface BaziBasics {
  /** 八字四柱干支, 如 ["甲子","丙寅","戊午","庚申"]; 时柱未知时为空串。 */
  bazi?: string[]
  /** 性别: 1 男 / 0 女。 */
  sex?: number
  /** 可选: 真太阳时字符串, 如 "1990-05-03 14:30"。 */
  trueSolarStr?: string
}

/** X-BAZI-UI 头内容 —— 当前 UI 选中的大运 / 流年 / 流月 (用户点击了哪几个)。 */
interface BaziUI {
  /** 选中的大运干支 + 描述, 如 [{ gz:"甲子", desc:"2024 · 40 岁" }]。 */
  dayun?: Array<{ gz?: string; desc?: string }>
  /** 选中的流年。 */
  liunian?: Array<{ gz?: string; desc?: string }>
  /** 选中的流月。 */
  liuyue?: Array<{ gz?: string; desc?: string }>
}

interface ChatRequestBody {
  messages?: ChatMessage[]
}

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_BASE_URL = 'https://api.openai.com/v1'
const MAX_ROUNDS = 8

const SYSTEM_PROMPT =
  '你是一个八字命理助手。请用简洁、通俗的中文回答用户关于八字、五行、十神、格局等问题。' +
  '不确定时如实说明, 不要编造。'

/** 从请求头解析 X-BAZI-BASICS / X-BAZI-UI (encodeURIComponent 包裹的 JSON), 容错缺头/坏 JSON。 */
function readHeaders(request: Request): { basics: BaziBasics; ui: BaziUI } {
  const parse = <T>(name: string, fallback: T): T => {
    const raw = request.headers.get(name)
    if (!raw) return fallback
    try {
      // 前端对含中文的头值做了 encodeURIComponent, 此处还原后再 JSON.parse
      return JSON.parse(decodeURIComponent(raw)) as T
    } catch {
      return fallback
    }
  }
  return {
    basics: parse<BaziBasics>('X-BAZI-BASICS', {}),
    ui: parse<BaziUI>('X-BAZI-UI', {}),
  }
}

/** 把命盘基础信息渲染成中文摘要 (八字 + 性别 + 可选真太阳时)。 */
function renderBasics(b: BaziBasics): string | null {
  const lines: string[] = []
  const baziStr = (b.bazi ?? []).filter(Boolean).join(' ')
  if (baziStr) lines.push(`八字: ${baziStr}`)
  const sexLabel = b.sex === 0 ? '女' : b.sex === 1 ? '男' : ''
  if (sexLabel) lines.push(`性别: ${sexLabel}`)
  if (b.trueSolarStr) lines.push(`真太阳时: ${b.trueSolarStr}`)
  return lines.length ? lines.join('\n') : null
}

/** 把选中大运 / 流年 / 流月渲染成中文摘要。 */
function renderUI(ui: BaziUI): string | null {
  const lines: string[] = []
  const fmt = (arr: Array<{ gz?: string; desc?: string }> | undefined) =>
    (arr ?? []).filter((d) => d && (d.gz || d.desc))
      .map((d) => (d.desc ? `${d.gz ?? ''}(${d.desc})` : (d.gz ?? '')))
  const dy = fmt(ui.dayun)
  const ln = fmt(ui.liunian)
  const ly = fmt(ui.liuyue)
  if (dy.length) lines.push(`当前选中大运: ${dy.join('、')}`)
  if (ln.length) lines.push(`当前选中流年: ${ln.join('、')}`)
  if (ly.length) lines.push(`当前选中流月: ${ly.join('、')}`)
  return lines.length ? lines.join('\n') : null
}

/** 流式 chunk 的最小形状 (规避 sdk 复杂泛型)。 */
interface StreamChunk {
  choices?: Array<{
    delta?: {
      content?: string | null
      tool_calls?: Array<{
        index: number
        id?: string
        function?: { name?: string; arguments?: string }
      }>
    }
  }>
}

/** 流式累计出的一个 tool_call。 */
interface AccToolCall {
  id: string
  name: string
  arguments: string
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

/** 处理一次 /api/chat 请求 —— 流式 + 多轮工具调用。 */
export async function chatStream(request: Request, env: ChatEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405)
  }

  if (!env.OPENAI_API_KEY) {
    return json(
      { error: '未配置 OPENAI_API_KEY' },
      500,
    )
  }

  let body: ChatRequestBody
  try {
    body = (await request.json()) as ChatRequestBody
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const userMsgs = (body.messages ?? []).filter((m) => m && m.role && m.content != null)
  if (userMsgs.length === 0) {
    return json({ error: 'No messages provided' }, 400)
  }

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: env.OPENAI_BASE_URL || DEFAULT_BASE_URL,
  })

  // 从请求头读取命盘基础信息 + UI 选中大运 (store 在后端不可见, 经头显式传递)
  const { basics, ui } = readHeaders(request)

  // 每个请求实例化独立 registry: 注入请求级 context (basics+ui) + Cloudflare KV binding + request。
  // init() 对 context 做稳定 hash 并写入 KV (key=ctx:<hash>), 工具可按 hash 取回。
  // 工具定义由 `import './toolbox'` 副作用 push 进全局 tools 数组, 构造器直接引用。
  const registry = new ToolRegistry({
    kv: env.KV as ToolKV | undefined,
    context: { basics, ui } as Record<string, unknown>,
    request,
  })
  await registry.init()
  const openaiTools = registry.toOpenAITools()

  // 与模型对话的完整消息列表 (含 system + 命盘上下文 + 选中大运 + 历史 + 工具结果)
  const ctxLines = [renderBasics(basics), renderUI(ui)].filter(Boolean)
  const sysContent = ctxLines.length
    ? `${SYSTEM_PROMPT}\n\n【当前命盘】\n${ctxLines.join('\n')}`
    : SYSTEM_PROMPT
  const conv: unknown[] = [{ role: 'system', content: sysContent }, ...userMsgs]

  const encoder = new TextEncoder()
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        for (let round = 0; round < MAX_ROUNDS; round++) {
          // 本轮模型流式响应; 同时累计 content 与 tool_calls
          const stream = (await client.chat.completions.create({
            model: env.OPENAI_MODEL || DEFAULT_MODEL,
            messages: conv as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
            stream: true,
            ...(openaiTools.length ? { tools: openaiTools } : {}),
          } as Record<string, unknown>)) as AsyncIterable<StreamChunk>

          let contentAcc = ''
          const toolMap = new Map<number, AccToolCall>()

          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta
            if (!delta) continue

            if (delta.content) {
              contentAcc += delta.content
              send({ content: delta.content })
            }

            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0
                const acc = toolMap.get(idx) ?? { id: '', name: '', arguments: '' }
                if (tc.id) acc.id = tc.id
                if (tc.function?.name) acc.name = tc.function.name
                if (tc.function?.arguments) acc.arguments += tc.function.arguments
                toolMap.set(idx, acc)
              }
            }
          }

          const toolCalls = [...toolMap.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([, v]) => v)

          // 无 tool_call → 模型已给出最终文本, 结束
          if (toolCalls.length === 0) {
            break
          }

          // 把 assistant 的 tool_call 消息回灌
          conv.push({
            role: 'assistant',
            content: contentAcc || null,
            tool_calls: toolCalls.map((tc) => ({
              id: tc.id,
              type: 'function' as const,
              function: { name: tc.name, arguments: tc.arguments || '{}' },
            })),
          })

          // 逐个执行工具并回灌 role:'tool' 结果
          // 拆成 start/end 两帧: start 时前端展示"调用中"特殊 bubble, end 时替换为完整卡片
          for (const tc of toolCalls) {
            let parsedArgs: unknown = tc.arguments
            try { parsedArgs = tc.arguments.trim() === '' ? {} : JSON.parse(tc.arguments) } catch { /* 保留原文 */ }
            send({ toolStart: { name: tc.name, args: parsedArgs } })
            const result = await registry.call(tc.name, tc.arguments)
            send({ toolEnd: { name: tc.name, result } })
            conv.push({ role: 'tool', tool_call_id: tc.id, content: result })
          }
          // 继续下一轮, 让模型消化工具结果
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (e) {
        send({ error: e instanceof Error ? e.message : String(e) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
    },
  })
}
