import { EMPTY_SUIYUN, deriveVisibility, type GejuHit } from './types'

/**
 * 标准化 detector 输出 — 综合 主局 / 岁运 两套判据 决定如何挂格:
 *   - 主局成格 + 岁运未变 / 无岁运       → 默认挂格 (原局段).
 *   - 主局成格 + 岁运破                 → 挂格 + 岁运.Break (原局段, 红框).
 *   - 主局未成 + 岁运补成               → 挂格 + 岁运.isSuiyun + 岁运.Trigger (岁运段).
 *   - 主局未成 + 岁运也未补成           → 不挂.
 *
 * `opts.isSuiyun` 强制把 hit 标为岁运域判定（即使 baseFormed 路径也保留 isSuiyun = true，
 * 例 羊刃驾杀：本格依赖岁运维持两停，需以 隐 颜色提示）。
 */
export function emitGeju(
  hit: { name: string; note: string; guigeVariant?: string },
  opts: {
    baseFormed: boolean
    withExtrasFormed: boolean
    hasExtras: boolean
    isSuiyun?: boolean
  },
): GejuHit | null {
  const { baseFormed, withExtrasFormed, hasExtras, isSuiyun = false } = opts
  if (baseFormed && (!hasExtras || withExtrasFormed)) {
    const 岁运 = { ...EMPTY_SUIYUN, isSuiyun }
    return { ...hit, 岁运, 显隐: deriveVisibility(岁运) }
  }
  if (baseFormed && hasExtras && !withExtrasFormed) {
    const 岁运 = { ...EMPTY_SUIYUN, isSuiyun, Break: true }
    return { ...hit, 岁运, 显隐: deriveVisibility(岁运) }
  }
  if (!baseFormed && hasExtras && withExtrasFormed) {
    const 岁运 = { ...EMPTY_SUIYUN, isSuiyun: true, Trigger: true }
    return { ...hit, 岁运, 显隐: deriveVisibility(岁运) }
  }
  return null
}
