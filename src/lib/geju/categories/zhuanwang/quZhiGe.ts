import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { checkZhuanWang } from './_check'

/**
 * 曲直格 — 甲乙木日主专旺。
 *
 * bazi-skills 5 条 (《渊海子平·曲直仁寿格》):
 *  1. 日主为甲 或 乙木
 *  2. 地支会成木局 — 亥卯未三合 OR 寅卯辰三会 (半合勉强、二字会气降品)
 *  3. 天干多透木 — 日主外另透甲/乙 ≥ 1 位; 壬癸生木更妙
 *  4. 无庚辛金透干克木 — 天干无金透 + 申酉本气不成势
 *  5. 火搭配适度 — 无火偏闷 / 微火"木火通明"复合贵 / 重火耗气降格
 *
 *  前 4 条必满足 (本格依赖 _check)；条件 5 关乎格品高低，本 detector 不
 *  阻塞，木火通明 / 木火相煎 由 categories/wuxing/木火.ts 单独判别。
 */
export function isQuZhiGe(): GejuHit | null {
  const r = checkZhuanWang('木')
  if (!r) return null
  return emitGeju(
    { name: '曲直格', note: r.note },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}
