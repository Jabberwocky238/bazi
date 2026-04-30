import { readShishen, readStrength } from '../../hooks'
import type { GejuHit } from '../../types'
import { monthGeFormed } from './_util'

/**
 * 正印格 — 实际判据 (与 md 4+1 条对照)：
 *  ① 月令本气正印 (md 条件 1; 印透干 + 月令藏 路径未实现)。
 *  ② 财 (正/偏) 紧贴正印 且 无比劫透 → 拦截 (md 条件 3 "财破印, 比劫救之")。
 *  ③ 身极旺 + 无财 + 无食伤 → 拦截 (md 条件 4 "身强 + 印重需财/食伤泄")。
 *  正印透干通根 (md 条件 2): 月支本气覆盖透干, 中气/余气根未单独 check。
 *  官印相生 (md 条件 5 升格): 不处理, 由 guansha/guanYinXiangSheng 独立 detector。
 */
export function isZhengYinGe(): GejuHit | null {
  const shishen = readShishen()
  const strength = readStrength()
  if (!monthGeFormed('正印')) return null
  const caiAdjYin =
    shishen.adjacentTou('正财', '正印') || shishen.adjacentTou('偏财', '正印')
  if (caiAdjYin && !shishen.touCat('比劫')) return null
  if (strength.level === '身极旺' && !shishen.touCat('财') && !shishen.touCat('食伤')) return null
  return { name: '正印格', note: '月令正印 (本气或透根)，无紧贴财破印' }
}
