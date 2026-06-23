/**
 * 腾讯云短信 —— TC3-HMAC-SHA256 签名 + SendSms。
 *
 * 为何不用 tencentcloud-sdk-nodejs-sms: 该 SDK 内部 require node-fetch /
 * https-proxy-agent (见 node_modules/tencentcloud-sdk-nodejs-common/.../fetch.js),
 * 走 Node 的 http/https 模块; Cloudflare Workers 即便开 nodejs_compat 也不提供这两个模块,
 * 直接 import 跑不起来。这里改用 Workers 原生 Web Crypto (HMAC-SHA256) 自行计算 TC3 签名,
 * 用全局 fetch 发请求, 结果与 SDK 等价, 零额外依赖。
 *
 * 参考签名流程: https://cloud.tencent.com/document/api/213/30654
 */

const SMS_HOST = 'sms.tencentcloudapi.com'
const SMS_ENDPOINT = `https://${SMS_HOST}`
const SERVICE = 'sms'
const VERSION = '2021-01-11'
const REGION = 'ap-guangzhou'

const encoder = new TextEncoder()

/** HMAC-SHA256, key/message 均按 UTF-8 编码; 返回 ArrayBuffer (可作下一层 key)。 */
async function hmac(key: BufferSource, msg: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(msg))
}

/** SHA-256 十六进制摘要。 */
async function sha256Hex(msg: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', encoder.encode(msg))
  return bufToHex(buf)
}

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** 通用腾讯云 API 调用 (TC3-HMAC-SHA256 签名 v3)。 */
async function tencentRequest<T = unknown>(
  action: string,
  payload: Record<string, unknown>,
  env: Env,
): Promise<T> {
  const secretId = env.TENCENT_SECRET_ID
  const secretKey = env.TENCENT_SECRET_KEY
  if (!secretId || !secretKey) {
    throw new Error('腾讯云凭证未配置 (TENCENT_SECRET_ID / TENCENT_SECRET_KEY)')
  }

  const payloadStr = JSON.stringify(payload)
  const timestamp = Math.floor(Date.now() / 1000)
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10) // UTC YYYY-MM-DD

  // 1. 拼接规范请求串 CanonicalRequest。
  //    签名头只含 content-type;host —— 与官方 SDK (sign3) 完全对齐, 不签 x-tc-action:
  //    若把 x-tc-action 纳入签名, 规范头里其值需小写 (sendms), 而实际发送的 X-TC-Action
  //    头是原值 (SendSms); 服务端按 SignedHeaders 取请求头原值重算签名会对不上,
  //    直接报 AuthFailure.SignatureFailure。SDK 的做法是不签它, 回避大小写问题。
  const canonicalHeaders =
    `content-type:application/json; charset=utf-8\n` +
    `host:${SMS_HOST}\n`
  const signedHeaders = 'content-type;host'
  const hashedPayload = await sha256Hex(payloadStr)
  const canonicalRequest = [
    'POST', '/', '', canonicalHeaders, signedHeaders, hashedPayload,
  ].join('\n')

  // 2. 拼接待签名串 StringToSign。
  const credentialScope = `${date}/${SERVICE}/tc3_request`
  const hashedCanonicalRequest = await sha256Hex(canonicalRequest)
  const stringToSign = [
    'TC3-HMAC-SHA256', String(timestamp), credentialScope, hashedCanonicalRequest,
  ].join('\n')

  // 3. 计算签名 SignatureDate → SecretService → SecretSigning → signature。
  const secretDate = await hmac(encoder.encode(`TC3${secretKey}`), date)
  const secretService = await hmac(secretDate, SERVICE)
  const secretSigning = await hmac(secretService, 'tc3_request')
  const signature = bufToHex(await hmac(secretSigning, stringToSign))

  // 4. 组装 Authorization 头并发请求。
  const authorization =
    `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`

  const res = await fetch(SMS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Host': SMS_HOST,
      'X-TC-Action': action,
      'X-TC-Timestamp': String(timestamp),
      'X-TC-Version': VERSION,
      'X-TC-Region': REGION,
      'Authorization': authorization,
    },
    body: payloadStr,
  })

  if (!res.ok) {
    throw new Error(`腾讯云 HTTP ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

interface SmsResponse {
  Response?: {
    Error?: { Code: string; Message: string }
    SendStatusSet?: Array<{ Code: string; Message?: string; PhoneNumber?: string }>
    RequestId?: string
  }
}

/**
 * 发送验证码短信。手机号传 11 位国内号 (如 13800138000), 内部补 +86 前缀。
 * 成功返回 void, 失败抛 Error。
 */
export async function sendSmsCode(env: Env, phone: string, code: string): Promise<void> {
  if (!env.TENCENT_SMS_SDK_APP_ID || !env.TENCENT_SMS_SIGN_NAME || !env.TENCENT_SMS_TEMPLATE_ID) {
    throw new Error('短信配置缺失 (TENCENT_SMS_SDK_APP_ID / SIGN_NAME / TEMPLATE_ID)')
  }

  const data = await tencentRequest<SmsResponse>(
    'SendSms',
    {
      PhoneNumberSet: [`+86${phone}`],
      SmsSdkAppId: env.TENCENT_SMS_SDK_APP_ID,
      SignName: env.TENCENT_SMS_SIGN_NAME,
      TemplateId: env.TENCENT_SMS_TEMPLATE_ID,
      TemplateParamSet: [code],
    },
    env,
  )

  const resp = data.Response
  if (!resp) throw new Error('腾讯云返回缺少 Response')
  if (resp.Error) {
    throw new Error(`腾讯云短信错误 ${resp.Error.Code}: ${resp.Error.Message}`)
  }
  const status = resp.SendStatusSet?.[0]
  if (!status || status.Code !== 'Ok') {
    throw new Error(`短信发送失败: ${status?.Message ?? '未知错误'}`)
  }
}
