/// <reference types="../worker-configuration.d.ts" />
import { chatStream } from './chat'
import { sendCode, register, me, logout } from './auth'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    // 聊天 —— OpenAI 流式 SSE
    if (url.pathname === '/api/chat') {
      return chatStream(request, env)
    }

    // 手机号注册 —— 发送验证码
    if (url.pathname === '/api/sms/send') {
      return sendCode(request, env)
    }

    // 手机号注册 —— 验码注册/登录
    if (url.pathname === '/api/auth/register') {
      return register(request, env)
    }

    // 会话查询 / 登出
    if (url.pathname === '/api/auth/me') {
      return me(request, env)
    }
    if (url.pathname === '/api/auth/logout') {
      return logout(request, env)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<Env>
