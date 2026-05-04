/**
 * 把 vite 注入的 ISO 8601 构建时间 (UTC) 按 hostname 选时区格式化:
 *   bazi.app238.com (Cloudflare 国际站) → 纽约时间 (America/New_York)
 *   bazi.app238.cn  (腾讯云 EdgeOne 国内站) → 北京时间 (Asia/Shanghai)
 *   其他 (本地开发 / 预览)              → 本地时区
 */
const FMT_OPTS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
}

interface ZoneInfo {
  tz: string
  label: string
}

function pickZone(): ZoneInfo {
  if (typeof window === 'undefined') return { tz: 'UTC', label: 'UTC' }
  const h = window.location.hostname
  if (h === 'bazi.app238.com') return { tz: 'America/New_York', label: '纽约时间' }
  if (h === 'bazi.app238.cn') return { tz: 'Asia/Shanghai', label: '北京时间' }
  return { tz: Intl.DateTimeFormat().resolvedOptions().timeZone, label: '本地时间' }
}

/** 返回 `2026-04-29 19:30:45` + 时区中文标签。 */
export function formatBuildTime(iso: string): { display: string; label: string } {
  const { tz, label } = pickZone()
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return { display: iso, label }
  const parts = new Intl.DateTimeFormat('zh-CN', { ...FMT_OPTS, timeZone: tz }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const display = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
  return { display, label }
}
