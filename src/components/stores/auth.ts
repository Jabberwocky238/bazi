import { create } from 'zustand'
import { nativeStore } from '@/native'

// ————————————————————————————————————————————————————————
// 手机号验证码登录态 —— 与 worker 的 /api/sms/send + /api/auth/register(+me/logout) 对接。
//
// 会话凭证 (JWT) 由后端经 HttpOnly Cookie 下发, JS 不可读; 这里只持有"展示用"
// 的 user 信息 (id/phone), 并把它镜像到 nativeStore 以便刷新后立即显示登录态
// (真实有效性仍由启动时的 /api/auth/me 校正 —— Cookie 过期则清空)。
//
// 所有请求走相对路径 /api/*: 生产下前端与 worker 同源 (bazi.app238.com),
// 同源请求默认携带 Cookie, Set-Cookie 也才能生效; WITH_WORKER 开发模式下
// cloudflare vite 插件把 /api/* 挂在同一 dev origin, 同样同源。
// ————————————————————————————————————————————————————————

export interface AuthUser {
  id: number
  phone: string
}

/** nativeStore 中镜像 user 的 key (仅展示用, 非凭证)。 */
const USER_KEY = 'auth:user'

interface SendCodeResult {
  ok: boolean
  /** dev 兜底: 未配置腾讯云凭证时后端原样返回的验证码, 便于本地联调。 */
  devCode?: string
  error?: string
}

interface RegisterResult {
  ok: boolean
  user?: AuthUser
  error?: string
}

interface AuthState {
  user: AuthUser | null
  /** 启动校验是否完成 (fetchMe 首次返回前为 false, 避免登录态闪烁)。 */
  ready: boolean

  /** 启动恢复: 先用 nativeStore 镜像乐观显示, 再 /api/auth/me 校正真实态。 */
  init: () => Promise<void>
  /** POST /api/sms/send —— 发送验证码 (60s 限频由后端管)。 */
  sendCode: (phone: string) => Promise<SendCodeResult>
  /** POST /api/auth/register —— 验码注册/登录, 成功后写入 user。 */
  register: (phone: string, code: string) => Promise<RegisterResult>
  /** GET /api/auth/me —— 校验当前会话 (启动恢复 / 校正乐观镜像)。 */
  fetchMe: () => Promise<void>
  /** POST /api/auth/logout —— 清除 Cookie 与本地镜像。 */
  logout: () => Promise<void>
}

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  ready: false,

  async init() {
    // 乐观恢复: 先用本地镜像立刻显示登录态, 再以 /me 为准校正。
    try {
      const cached = await nativeStore.getItem(USER_KEY)
      if (cached) set({ user: JSON.parse(cached) as AuthUser })
    } catch { /* 镜像损坏忽略 */ }
    await get().fetchMe()
    set({ ready: true })
  },

  async sendCode(phone) {
    try {
      const res = await postJson('/api/sms/send', { phone })
      const data = (await res.json()) as { ok?: boolean; devCode?: string; error?: string }
      if (!res.ok) return { ok: false, error: data.error ?? `发送失败 (${res.status})` }
      return { ok: true, devCode: data.devCode }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : '网络异常' }
    }
  },

  async register(phone, code) {
    try {
      const res = await postJson('/api/auth/register', { phone, code })
      const data = (await res.json()) as { ok?: boolean; user?: AuthUser; error?: string }
      if (!res.ok || !data.user) return { ok: false, error: data.error ?? `登录失败 (${res.status})` }
      const user = data.user
      set({ user })
      void nativeStore.setItem(USER_KEY, JSON.stringify(user))
      return { ok: true, user }
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : '网络异常' }
    }
  },

  async fetchMe() {
    try {
      const res = await fetch('/api/auth/me', { method: 'GET' })
      if (res.status === 401) {
        set({ user: null })
        void nativeStore.removeItem(USER_KEY)
        return
      }
      const data = (await res.json()) as { ok?: boolean; user?: AuthUser }
      if (res.ok && data.user) {
        set({ user: data.user })
        void nativeStore.setItem(USER_KEY, JSON.stringify(data.user))
      } else {
        set({ user: null })
      }
    } catch {
      // 网络异常时保留乐观镜像, 不清空 (离线可用)。
    }
  },

  async logout() {
    try {
      await postJson('/api/auth/logout', {})
    } catch { /* 即便请求失败也清本地态 */ }
    set({ user: null })
    void nativeStore.removeItem(USER_KEY)
  },
}))
