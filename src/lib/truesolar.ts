/**
 * 真太阳时：把民用时（北京时间 / 120°E）按均时差修正到真太阳时。
 * 这里不含经度修正；若以后加经度字段，需再加 (longitude - 120) * 4 分钟。
 */

/** 年内第几天 (1..366)。 */
function dayOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1)
  const d = Date.UTC(year, month - 1, day)
  return Math.floor((d - start) / 86400000) + 1
}

/** 均时差近似公式 → 分钟。正值表示真太阳时领先于平太阳时。 */
export function equationOfTime(year: number, month: number, day: number): number {
  const n = dayOfYear(year, month, day)
  const B = (2 * Math.PI * (n - 81)) / 365
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

/** 把 (年月日时分) 视为 120°E 民用时，返回对应真太阳时的 Date。 */
export function toTrueSolarDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const eot = equationOfTime(year, month, day)
  const d = new Date(year, month - 1, day, hour, minute, 0)
  d.setMinutes(d.getMinutes() + Math.round(eot))
  return d
}

export function formatTrueSolar(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${dd} ${hh}:${mm}`
}
