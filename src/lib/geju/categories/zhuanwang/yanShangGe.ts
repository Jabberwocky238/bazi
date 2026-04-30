import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { checkZhuanWang } from './_check'

/**
 * 炎上格 — 丙丁火日主专旺。
 *
 * bazi-skills 5 条 (《渊海子平·炎上格》):
 *  1. 日主为丙 或 丁火
 *  2. 地支会成火局 — 寅午戌三合 OR 巳午未三会 (半合勉强成立)
 *  3. 天干多透火 — 日主外另透丙/丁 ≥ 1 位; 甲乙木生火更妙 (薪柴充足)
 *  4. 无壬癸水透干灭火 — 天干无水透 + 亥子本气不成势
 *  5. 土金搭配适度
 *      - 土微泄秀可喜; 土多 → 火土夹带 / 火炎土燥 (降格)
 *      - 金微无害; 金重则忌 (耗火)
 *
 *  前 4 条必满足 (本格依赖 _check)；条件 5 关乎格品高低，本 detector 不
 *  阻塞，火土 / 火金 复合象由 categories/wuxing/ 下相应文件单独判别。
 */
export function isYanShangGe(): GejuHit | null {
  const r = checkZhuanWang('火')
  if (!r) return null
  return emitGeju(
    { name: '炎上格', note: r.note },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}
