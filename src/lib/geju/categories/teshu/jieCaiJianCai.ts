import { readShishen } from '../../hooks'
import type { GejuHit } from '../../types'

/**
 * 劫财见财 — 实际判据 (与 md 5 条 + 2 救应对照, 完整覆盖)：
 *  ① 劫财透干且通根 (md 条件 1 "劫财透 + 通根")。
 *  ② 财类透干 (md 条件 2 "财能被克到", 此处不强求紧贴)。
 *  ③ 比劫总数 > 财总数 (md 条件 3 "财轻劫重")。
 *  ④ 无官杀透 (md 条件 4 "官星护财" 救应不成立)。
 *  ⑤ 无食伤透 (md 条件 5 "食伤通关" 救应不成立)。
 *
 * 【岁运】md 内容.md "流年引入构成临时劫财见财 / 原局无官无食伤+大运再走比劫":
 *   - 主局财旺 + 流年比劫透 → 临时劫财见财, 那一年易破财 (suiyunTrigger)。
 *   - 主局已劫财见财 + 岁运再补比劫 → 爆发年 (破财 / 婚变 / 合伙裂)。
 *   - 主局无官无食伤 + 大运再走比劫 → 破财爆发年。
 *   当前 detector 仅扫主柱, 未叠加岁运临时引入。
 */
export function isJieCaiJianCai(): GejuHit | null {
  const shishen = readShishen()
  if (!shishen.tou('劫财')) return null
  if (!shishen.zang('劫财')) return null
  if (!shishen.touCat('财')) return null
  if (shishen.countCat('比劫') <= shishen.countCat('财')) return null
  if (shishen.touCat('官杀')) return null
  if (shishen.touCat('食伤')) return null
  return { name: '劫财见财', note: '劫财透根 · 财弱无官食救 · 夺财' }
}
