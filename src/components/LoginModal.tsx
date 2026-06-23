import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '@@/stores'
import { CommonButton } from '@@/CommonButton'

// ————————————————————————————————————————————————————————
// 手机号验证码登录浮层内容 —— 由 useDialog().open((api) => <LoginModal close={api.close}/>, …) 投递。
//
// 流程: 输入手机号 → 发送验证码 (60s 倒计时限频, 与后端 lock 互为冗余) →
// 输入 6 位验证码 → 提交 → 成功后写入 auth store 并自关。
// dev 兜底: 后端未配置腾讯云凭证时返回 devCode, 这里直接展示供本地联调。
// ————————————————————————————————————————————————————————

const PHONE_RE = /^1[3-9]\d{9}$/
const CODE_RE = /^\d{6}$/
const RESEND_SECONDS = 60

interface LoginModalProps {
  close: () => void
}

export function LoginModal({ close }: LoginModalProps) {
  const sendCode = useAuth((s) => s.sendCode)
  const register = useAuth((s) => s.register)

  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [devCode, setDevCode] = useState<string | null>(null)

  const phoneRef = useRef<HTMLInputElement>(null)
  useEffect(() => { phoneRef.current?.focus() }, [])

  // 60s 倒计时 (发送成功后启动)。
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const phoneValid = PHONE_RE.test(phone)
  const codeValid = CODE_RE.test(code)

  async function handleSend() {
    if (!phoneValid || sending || countdown > 0) return
    setSending(true)
    setError(null)
    setDevCode(null)
    const r = await sendCode(phone)
    setSending(false)
    if (!r.ok) {
      setError(r.error ?? '发送失败')
      return
    }
    setCountdown(RESEND_SECONDS)
    if (r.devCode) setDevCode(r.devCode)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!phoneValid || !codeValid || submitting) return
    setSubmitting(true)
    setError(null)
    const r = await register(phone, code)
    setSubmitting(false)
    if (!r.ok) {
      setError(r.error ?? '登录失败')
      return
    }
    close()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 手机号 */}
      <label className="block">
        <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">手机号</span>
        <input
          ref={phoneRef}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          maxLength={11}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
          placeholder="请输入 11 位手机号"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
      </label>

      {/* 验证码 + 发送 */}
      <label className="block">
        <span className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">验证码</span>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="6 位验证码"
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm tracking-[0.3em] text-slate-700 outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!phoneValid || sending || countdown > 0}
            className="shrink-0 rounded-xl border border-slate-300 px-3 py-2.5 text-xs font-medium text-slate-600 transition hover:border-amber-500 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:border-amber-400 dark:hover:text-amber-400"
          >
            {countdown > 0 ? `${countdown}s 后重发` : sending ? '发送中…' : '发送验证码'}
          </button>
        </div>
      </label>

      {/* dev 兜底提示 */}
      {devCode && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          开发模式未发短信, 验证码: <span className="font-mono font-bold tracking-widest">{devCode}</span>
        </div>
      )}

      {/* 错误 */}
      {error && (
        <div className="rounded-lg border border-red-300/60 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <CommonButton type="submit" variant="primary" width="w-full" disabled={!phoneValid || !codeValid || submitting}>
        {submitting ? '登录中…' : '登录 / 注册'}
      </CommonButton>

      <p className="text-center text-[11px] text-slate-400 dark:text-slate-600">
        未注册手机号将自动注册。登录态保留 30 天。
      </p>
    </form>
  )
}
