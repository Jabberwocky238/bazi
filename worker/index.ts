import { chatStream, type ChatEnv } from './chat'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // 聊天 —— OpenAI 流式 SSE
    if (url.pathname === '/api/chat') {
      return chatStream(request, env)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
