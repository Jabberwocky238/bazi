import { useEffect, useState } from 'react'
import { formatBuildTime } from '@@/buildTime'

function CloudflareIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="w-3.5 h-3.5 inline-block">
      <path
        fill="#F38020"
        d="M33.5 27.9c.2-.7-.1-1.3-.7-1.4l-12.5-.2c-.1 0-.2-.1-.2-.2 0-.1 0-.2.1-.3 0 0 0 0 0 0l12.5-.2c1.5-.1 3.1-1.3 3.7-2.7l.7-1.9c0-.1 0-.1 0-.2C36.7 17.1 32.3 13 27 13c-4.9 0-9.1 3.1-10.5 7.5-1-.7-2.3-1.1-3.6-1-2.5.2-4.5 2.2-4.7 4.7-.1.6 0 1.2.1 1.8-4 .1-7.3 3.4-7.3 7.5 0 .3 0 .7.1 1.1 0 .2.2.3.3.3l31.3.1c.1 0 .2-.1.3-.2l.5-1.9z"
      />
      <path
        fill="#FAAE40"
        d="M37.6 21.8c-.1 0-.2 0-.4 0-.1 0-.2.1-.2.2l-.5 1.6c-.2.7.1 1.3.7 1.4l2.6.2c.1 0 .2.1.2.2 0 .1 0 .2-.1.3 0 0 0 0 0 0l-2.7.2c-1.5.1-3.1 1.3-3.7 2.7l-.2.6c0 .1 0 .2.1.2h9.3c.1 0 .2-.1.3-.2.2-.7.3-1.4.3-2.2 0-3-2.5-5.2-5.7-5.2z"
      />
    </svg>
  )
}

interface HostInfo {
  label: string
  provider?: string
  icon?: React.ReactNode
  tone: 'intl' | 'cn' | 'dev'
  switchUrl?: string
  switchLabel?: string
}

function detectHost(): HostInfo {
  if (typeof window === 'undefined') return { label: '加载中…', tone: 'dev' }
  const h = window.location.hostname
  if (h === 'bazi.app238.com') {
    return {
      label: '国际站',
      provider: 'Cloudflare',
      icon: <CloudflareIcon />,
      tone: 'intl',
      switchUrl: 'https://bazi.app238.cn',
      switchLabel: '前往国内站',
    }
  }
  if (h === 'bazi.app238.cn') {
    return {
      label: '国内站',
      provider: '腾讯云 EdgeOne',
      tone: 'cn',
      switchUrl: 'https://bazi.app238.com',
      switchLabel: '前往国外站',
    }
  }
  return {
    label: '测试链接',
    tone: 'dev',
    switchUrl: 'https://bazi.app238.com',
    switchLabel: '前往国外站',
  }
}

const TONE_CLS: Record<HostInfo['tone'], string> = {
  intl: 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-400',
  cn: 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400',
  dev: 'border-slate-400/40 bg-slate-400/10 text-slate-600 dark:text-slate-400',
}

export function Footer() {
  const linkCls = 'text-amber-700 dark:text-amber-400 underline'
  const [host, setHost] = useState<HostInfo>({ label: '加载中…', tone: 'dev' })
  useEffect(() => { setHost(detectHost()) }, [])
  const build = formatBuildTime(__APP_BUILD_TIME__)

  return (
    <footer className="mt-10 text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800 pt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
      {host.switchUrl ? (
        <a
          href={host.switchUrl}
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border transition hover:brightness-110 ${TONE_CLS[host.tone]}`}
          title={host.switchLabel}
        >
          {host.icon}
          <span>您当前位于 <b className="font-medium">{host.label}</b></span>
          {host.provider && <span>· 托管于 {host.provider}</span>}
          <span className="ml-1 text-[10px] opacity-80">· 点击{host.switchLabel} →</span>
        </a>
      ) : (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${TONE_CLS[host.tone]}`}>
          {host.icon}
          <span>您当前位于 <b className="font-medium">{host.label}</b></span>
          {host.provider && <span>· 托管于 {host.provider}</span>}
        </span>
      )}
      <span>
        释义来源 ·{' '}
        <a href="https://github.com/Jabberwocky238/bazi-skills" className={linkCls} target="_blank" rel="noreferrer">
          bazi-skills
        </a>
        {' '}
        <span className="text-slate-500 dark:text-slate-500 tabular-nums">
          {__SKILLS_COMMIT__} · {__SKILLS_DATE__.slice(0, 10)}
        </span>
      </span>
      <span>
        排盘计算 ·{' '}
        <a href="https://github.com/Jabberwocky238/bazi-engine" className={linkCls} target="_blank" rel="noreferrer">
          bazi-engine
        </a>
        {' '}
        <span className="text-slate-500 dark:text-slate-500 tabular-nums">v{__ENGINE_VERSION__}</span>
      </span>
      <span>
        本项目 ·{' '}
        <a href="https://github.com/Jabberwocky238/ultimate-bazi" className={linkCls} target="_blank" rel="noreferrer">
          ultimate-bazi
        </a>
        {' '}
        <span className="text-slate-500 dark:text-slate-500 tabular-nums">
          {__APP_COMMIT__} · 构建于 {build.display} · {build.label}
        </span>
      </span>
    </footer>
  )
}
