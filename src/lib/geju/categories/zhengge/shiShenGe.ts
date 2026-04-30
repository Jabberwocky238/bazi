import { readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 食神格 — 实际判据 (与 md 5+1 条对照)：
 *  ① 月令本气食神 (md 条件 1; 食透 + 月令藏 路径未实现)。
 *  ② 身非极弱 / 近从弱 (md 条件 3 "日主有根")。
 *  ③ 偏印紧贴食神 且 无财 (枭神夺食) → 拦截 (md 条件 4)。
 *  食神透干通根 (md 条件 2): 月支本气覆盖透干, 中气/余气根未单独 check。
 *  食伤不混 (md 条件 5): 此处不阻塞, 由 shishang/shiShangHunZa 独立 detector 警示。
 *  食神生财 (md 条件 6 升格): 由 shishang/shiShenShengCai 独立 detector。
 */
export function isShiShenGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  if (!monthGeFormed('食神')) return null
  // 严格"食伤不混"由独立 detector isShiShangHunZa 给出警示；此处不再阻塞成格。
  if (strength.level === '身极弱' || strength.level === '近从弱') return null
  const xiaoDuoShi =
    shishen.tou('偏印') && shishen.adjacentTou('偏印', '食神') && !shishen.touCat('财')
  if (xiaoDuoShi) return null
  return { name: '食神格', note: '月令食神 (本气或透根)，无枭夺食' }
}
