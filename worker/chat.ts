/**
 * 聊天 echo 模拟器后端 —— Cloudflare Worker 路由处理。
 * 仅使用 Web 标准 Request/Response, 无运行时依赖。
 *
 * 请求: POST, body 为 `{ messages: { role: 'user'|'assistant', content: string }[] }`
 *       (也兼容 `{ text: string }`)
 * 响应: `{ reply: string }`, reply = 原样回显最后一条用户消息。
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequestBody {
  messages?: ChatMessage[]
  text?: string
}

/** 从请求体取出最后一条用户消息文本; 取不到时回退到任意最后一条。 */
function lastUserText(body: ChatRequestBody): string | null {
  if (body.text) return body.text
  const msgs = body.messages
  if (!msgs || msgs.length === 0) return null
  for (let i = msgs.length - 1; i >= 0; i--) {
    if (msgs[i].role === 'user') return msgs[i].content
  }
  return msgs[msgs.length - 1].content ?? null
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

/** 处理一次 /api/chat 请求。 */
export async function chatEcho(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method Not Allowed' }, 405)
  }

  let body: ChatRequestBody
  try {
    body = (await request.json()) as ChatRequestBody
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const userText = lastUserText(body)
  if (userText === null || userText.trim() === '') {
    return json({ error: 'No user message provided' }, 400)
  }

  // 模拟一点网络/思考延迟, 让对话更有"聊天感"
  await new Promise((r) => setTimeout(r, 300))

  return json({ reply: userText })
}
