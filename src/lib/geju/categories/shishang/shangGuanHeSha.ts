import { readBazi, readShishen } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 伤官合杀（依 md 5 条）：
 *  1. 阴日主（乙/丁/己/辛/癸）。
 *  2. 伤官与七杀均透干。
 *  3. 位置紧贴。
 *  4. 无争合（伤官或七杀在干上 ≤ 1 位）。
 *  5. 化神（若化）非忌 —— ctx 无法判定喜忌，略。
 *
 * 【岁运】md 内容.md "大运流年可引动合 / 冲开合":
 *   - 主局伤杀单透 + 岁运补另一方 → 引动合 (suiyunTrigger)。
 *   - 主局合成立 + 岁运透与伤或杀相冲之字 → 冲开合, 伤杀重活 (suiyunBreak)。
 *   当前 detector 仅扫主柱, 未把岁运引动 / 冲开纳入。
 */
export function isShangGuanHeSha(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  if (bazi.dayYang) return null
  if (!shishen.tou('伤官') || !shishen.tou('七杀')) return null
  if (!shishen.adjacentTou('伤官', '七杀')) return null
  const shangN = bazi.mainArr.filter((p, i) => i !== 2 && p.shishen === '伤官').length
  const shaN = bazi.mainArr.filter((p, i) => i !== 2 && p.shishen === '七杀').length
  if (shangN > 1 || shaN > 1) return null
  return { name: '伤官合杀', note: `阴日主 ${bazi.dayGan} 伤官七杀紧贴双透五合，无争合` }
}
