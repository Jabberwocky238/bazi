/**
 * HS256 JWT —— 用 Web Crypto (HMAC-SHA256) 签发/校验, 用于注册后的登录态。
 * 不引第三方库; base64url 自行实现, 适配 Workers。
 */

/** 默认有效期: 30 天。 */
const DEFAULT_TTL = 30 * 24 * 60 * 60
const COOKIE_NAME = 'session'

const encoder = new TextEncoder()

function b64urlEncode(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(str: string): Uint8Array {
  const pad = '='.repeat((4 - (str.length % 4)) % 4)
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function hmac(key: BufferSource, msg: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(msg))
}

function bufToB64url(buf: ArrayBuffer): string {
  return b64urlEncode(new Uint8Array(buf))
}

export interface JwtPayload {
  sub: number       // user id
  phone: string
  iat: number       // 签发时间 (秒)
  exp: number       // 过期时间 (秒)
}

/** 签发 JWT。 */
export async function signJwt(payload: Omit<JwtPayload, 'iat' | 'exp'> & { exp?: number }, env: Env): Promise<string> {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET 未配置')
  const now = Math.floor(Date.now() / 1000)
  const full: JwtPayload = { ...payload, iat: now, exp: payload.exp ?? now + DEFAULT_TTL }

  const header = { alg: 'HS256', typ: 'JWT' }
  const headerB64 = b64urlEncode(encoder.encode(JSON.stringify(header)))
  const payloadB64 = b64urlEncode(encoder.encode(JSON.stringify(full)))
  const signingInput = `${headerB64}.${payloadB64}`
  const sig = bufToB64url(await hmac(encoder.encode(env.JWT_SECRET), signingInput))
  return `${signingInput}.${sig}`
}

/** 校验 JWT: 签名 + 过期。成功返回 payload, 否则 null。 */
export async function verifyJwt(token: string, env: Env): Promise<JwtPayload | null> {
  if (!env.JWT_SECRET) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [headerB64, payloadB64, sigB64] = parts
  const signingInput = `${headerB64}.${payloadB64}`

  const expected = bufToB64url(await hmac(encoder.encode(env.JWT_SECRET), signingInput))
  // 定长字符串比较, 避免提前返回造成时序泄露。
  if (expected.length !== sigB64.length || !timingSafeEqual(expected, sigB64)) return null

  let payload: JwtPayload
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadB64)))
  } catch {
    return null
  }
  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return null
  }
  return payload
}

function timingSafeEqual(a: string, b: string): boolean {
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/** 从请求 Cookie 中解析当前会话; 校验通过返回 payload, 否则 null。 */
export async function parseSession(request: Request, env: Env): Promise<JwtPayload | null> {
  const cookie = request.headers.get('Cookie') ?? ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  if (!match) return null
  return verifyJwt(match[1], env)
}

/**
 * 在响应上设置会话 Cookie。HttpOnly 防 JS 读取; SameSite=Lax 防 CSRF;
 * Secure 仅在生产 HTTPS 下生效 (dev 的 http 本地不强制, 由 isSecure 控制)。
 */
export function setSessionCookie(token: string, opts: { maxAge?: number; isSecure: boolean } = { isSecure: true }): string {
  const maxAge = opts.maxAge ?? DEFAULT_TTL
  const parts = [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  if (opts.isSecure) parts.push('Secure')
  return parts.join('; ')
}

/** 清除会话 Cookie —— 用 Max-Age=0 让浏览器立即删除 (HttpOnly, JS 无法直接清)。 */
export function clearSessionCookie(opts: { isSecure: boolean } = { isSecure: true }): string {
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0']
  if (opts.isSecure) parts.push('Secure')
  return parts.join('; ')
}

export const SESSION_COOKIE_NAME = COOKIE_NAME
