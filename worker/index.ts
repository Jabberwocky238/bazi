import { chatEcho } from './chat'

export interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // 聊天 echo 模拟器
    if (url.pathname === '/api/chat') {
      return chatEcho(request)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
