import { useEffect, useRef } from 'react'
import { useAuth } from '@@/stores'
import { useDialog } from '@@/Dialog'
import { LoginModal } from '@@/LoginModal'
import { CommonButton } from '@@/CommonButton'

// ————————————————————————————————————————————————————————
// 登录入口 —— 常驻 AppBar 右侧。
// 启动时调 useAuth.init() 恢复会话 (nativeStore 乐观镜像 + /api/auth/me 校正)。
// 未登录: 点击打开 LoginModal; 已登录: 点击打开账号浮层 (手机号 + 登出)。
// ————————————————————————————————————————————————————————

// 模块级 guard: React StrictMode 下 effect 双调用, 避免重复 /me。
let booted = false

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  )
}

export function AuthButton() {
  const user = useAuth((s) => s.user)
  const init = useAuth((s) => s.init)
  const logout = useAuth((s) => s.logout)
  const dialog = useDialog()
  const ranRef = useRef(false)

  useEffect(() => {
    if (ranRef.current || booted) return
    ranRef.current = true
    booted = true
    void init()
  }, [init])

  function openLogin() {
    dialog.open(
      ({ close }) => <LoginModal close={close} />,
      { title: '登录 / 注册', subtitle: 'Phone' },
    )
  }

  function openAccount() {
    dialog.open(
      ({ close }) => (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 px-3 py-3 dark:bg-slate-800">
            <div className="text-[11px] text-slate-400">当前账号</div>
            <div className="mt-0.5 font-mono text-sm tracking-wider text-slate-700 dark:text-slate-200">
              {user?.phone}
            </div>
          </div>
          <CommonButton
            variant="danger"
            width="w-full"
            onClick={async () => {
              await logout()
              close()
            }}
          >
            登出
          </CommonButton>
        </div>
      ),
      { title: '账号', subtitle: 'Account' },
    )
  }

  return (
    <button
      type="button"
      onClick={user ? openAccount : openLogin}
      aria-label={user ? '账号' : '登录'}
      className={`shrink-0 p-1.5 rounded-lg transition ${user ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'}`}
    >
      <UserIcon />
    </button>
  )
}
