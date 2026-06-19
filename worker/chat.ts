import OpenAI from 'openai'

/**
 * 聊天后端 —— OpenAI (兼容端点) 流式 SSE。
 *
 * 仅使用 Web 标准 Request/Response + openai sdk, 适配 Cloudflare Worker。
 *
 * 请求: POST, body `{ messages: { role, content }[] }`
 * 响应: text/event-stream, 每帧 `data: {"content":"..."}\n\n`, 末尾 `data: [DONE]\n\n`
 *       出错时 (如未配置 key) 返回普通 JSON `{ error }`。
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
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatRequestBody {
  messages?: ChatMessage[]
}

const DEFAULT_MODEL = 'gpt-4o-mini'
const DEFAULT_BASE_URL = 'https://api.openai.com/v1'

const SYSTEM_PROMPT =
  '你是一个八字命理助手。请用简洁、通俗的中文回答用户关于八字、五行、十神、格局等问题。' +
  '不确定时如实说明, 不要编造。'

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

/** 处理一次 /api/chat 请求 —— 流式返回。 */
export async function chatStream(request: Request, env: ChatEnv): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405)
  }

  if (!env.OPENAI_API_KEY) {
    return json(
      { error: '未配置 OPENAI_API_KEY (本地写入 .dev.vars, 部署用 wrangler secret put OPENAI_API_KEY)' },
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

  let stream: AsyncIterable<{ choices?: Array<{ delta?: { content?: string } }> }>
  try {
    stream = await client.chat.completions.create({
      model: env.OPENAI_MODEL || DEFAULT_MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...userMsgs],
      stream: true,
    }) as AsyncIterable<{ choices?: Array<{ delta?: { content?: string } }> }>
  } catch (e) {
    return json({ error: `OpenAI 请求失败: ${e instanceof Error ? e.message : String(e)}` }, 502)
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta?.content
          if (delta) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (e) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: e instanceof Error ? e.message : String(e) })}\n\n`,
          ),
        )
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
