/**
 * 手机号注册流程处理器 —— /api/sms/send + /api/auth/register。
 *
 * - 验证码与发送限频存 KV (原生 TTL, 已绑定);
 * - 用户数据存 D1 (binding: DB);
 * - 注册成功签发 JWT, 经 HttpOnly Cookie 下发。
 *
 * dev 兜底: 未配置腾讯云凭证 (TENCENT_SECRET_ID) 时跳过真实发短信,
 * 把验证码随响应返回, 便于无凭证本地联调。
 */

import { sendSmsCode } from './tencent-sms'
import { signJwt, setSessionCookie } from './jwt'

/** 中国大陆手机号: 1 + [3-9] + 9 位。 */
const PHONE_RE = /^1[3-9]\d{9}$/

const CODE_TTL = 5 * 60        // 验证码 5 分钟过期
const RESEND_LOCK_TTL = 60     // 60 秒内不可重发
const SESSION_MAX_AGE = 30 * 24 * 60 * 60

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  })
}

/** 生成 6 位数字验证码 (crypto 随机, 前导 0 补齐)。 */
function genCode(): string {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return String(buf[0] % 1_000_000).padStart(6, '0')
}

/** POST /api/sms/send —— 发送验证码。body: { phone } */
export async function sendCode(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'Method Not Allowed' })

  let phone: string
  try {
    ;({ phone } = await request.json<{ phone: string }>())
  } catch {
    return json(400, { error: '请求体不是合法 JSON' })
  }
  if (typeof phone !== 'string' || !PHONE_RE.test(phone)) {
    return json(400, { error: '手机号格式不正确' })
  }

  const kv = env.KV
  if (!kv) return json(500, { error: 'KV 未绑定' })

  // 限频: 60 秒内同一手机号只能发一次。
  const lockKey = `sms:lock:${phone}`
  if (await kv.get(lockKey)) {
    return json(429, { error: '发送过于频繁, 请 60 秒后重试' })
  }

  const code = genCode()
  await kv.put(`sms:code:${phone}`, code, { expirationTtl: CODE_TTL })
  await kv.put(lockKey, '1', { expirationTtl: RESEND_LOCK_TTL })

  // dev 兜底: 无凭证时不真正发短信。
  if (!env.TENCENT_SECRET_ID) {
    return json(200, { ok: true, devCode: code, note: '未配置腾讯云凭证, 已跳过真实发送' })
  }

  try {
    await sendSmsCode(env, phone, code)
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : '短信发送失败' })
  }
  return json(200, { ok: true })
}

/** POST /api/auth/register —— 验码注册/登录。body: { phone, code } */
export async function register(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'Method Not Allowed' })

  let phone: string, code: string
  try {
    ;({ phone, code } = await request.json<{ phone: string; code: string }>())
  } catch {
    return json(400, { error: '请求体不是合法 JSON' })
  }
  if (typeof phone !== 'string' || !PHONE_RE.test(phone)) {
    return json(400, { error: '手机号格式不正确' })
  }
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return json(400, { error: '验证码格式不正确' })
  }

  const kv = env.KV
  if (!kv) return json(500, { error: 'KV 未绑定' })
  const db = env.DB
  if (!db) return json(500, { error: 'D1 未绑定' })

  // 校验验证码 (一次性, 验后即删)。
  const stored = await kv.get(`sms:code:${phone}`)
  if (!stored || stored !== code) {
    return json(400, { error: '验证码无效或已过期' })
  }
  await kv.delete(`sms:code:${phone}`)

  // 幂等 upsert: 已注册即视为登录, 仅刷新 updated_at。
  const now = Date.now()
  const result = await db
    .prepare(
      `INSERT INTO users (phone, created_at, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(phone) DO UPDATE SET updated_at = excluded.updated_at
       RETURNING id, phone`,
    )
    .bind(phone, now, now)
    .first<{ id: number; phone: string }>()

  if (!result) return json(500, { error: '用户写入失败' })

  // 签发 JWT 并通过 HttpOnly Cookie 下发。
  let token: string
  try {
    token = await signJwt({ sub: result.id, phone: result.phone }, env)
  } catch (e) {
    return json(500, { error: e instanceof Error ? e.message : '会话签发失败' })
  }

  const isSecure = new URL(request.url).protocol === 'https:'
  const cookie = setSessionCookie(token, { maxAge: SESSION_MAX_AGE, isSecure })
  return json(200, { ok: true, user: result }, { 'set-cookie': cookie })
}
