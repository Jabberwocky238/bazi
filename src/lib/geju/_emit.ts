import type { GejuHit } from './types'

/**
 * 标准化 detector 输出 — 综合 主局 / 岁运 两套判据 决定如何挂格:
 *   - 主局成格 + 岁运未变 / 无岁运       → 默认挂格 (原局段).
 *   - 主局成格 + 岁运破                 → 挂格 + suiyunBreak (原局段, 红框).
 *   - 主局未成 + 岁运补成               → 挂格 + suiyunSpecific + suiyunTrigger (岁运段).
 *   - 主局未成 + 岁运也未补成           → 不挂.
 */
export function emitGeju(
  hit: GejuHit,
  opts: { baseFormed: boolean; withExtrasFormed: boolean; hasExtras: boolean },
): GejuHit | null {
  const { baseFormed, withExtrasFormed, hasExtras } = opts
  if (baseFormed && (!hasExtras || withExtrasFormed)) return hit
  if (baseFormed && hasExtras && !withExtrasFormed) return { ...hit, suiyunBreak: true }
  if (!baseFormed && hasExtras && withExtrasFormed) {
    return { ...hit, suiyunSpecific: true, suiyunTrigger: true }
  }
  return null
}
