import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { checkZhuanWang } from './_check'

/**
 * 从革格 — 庚辛金日主专旺。
 *
 * bazi-skills 6 条 (《渊海子平·从革格》《穷通宝鉴·庚金章》《滴天髓·从象》):
 *  1. 日主为庚 或 辛金                                       [静态]
 *  2. 地支会成金局 — 巳酉丑三合 OR 申酉戌三会               [可被岁运补]
 *  3. 天干多透金 — 日主外另透庚/辛 ≥ 1 位                   [可被岁运补]
 *  4. 无丙丁火透干熔金                                       [岁运透火 → Break]
 *  5. 无甲乙木过重对抗 — 木为金之财                          [岁运透木 → Break]
 *  6. (助力) 水秀气 → "金白水清" 复合贵格                   [可被岁运补 → 升格]
 *
 *  本 detector: 1 静态；2/3/4/5 由 _check 处理；6 通过本文件 hasShui 计算。
 *  emitGeju 装配 显/隐/Break。
 *
 *  注意: md 明确称该贵格为"金白水清"，本代码字段 guigeVariant 写为
 *  "剑如秋水" 与 md 不同名 (待统一)。
 */
export function isCongGeGe(): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()
  const r = checkZhuanWang('金')
  if (!r) return null

  const baseShuiN = bazi.ganWxCount('水') + bazi.zhiMainWxCount('水')
  const extraShuiAdd = extras.extraGanWxCount('水') + extras.extraZhiMainWxCount('水')
  const hasShui = baseShuiN > 0 || extraShuiAdd > 0
  const variantNote = baseShuiN > 0
    ? ` · 水泄秀 ${baseShuiN} 位`
    : extraShuiAdd > 0
      ? ` · 岁运水泄秀 ${extraShuiAdd} 位`
      : ''

  return emitGeju(
    {
      name: '从革格',
      note: `${r.note}${variantNote}`,
      ...(hasShui ? { guigeVariant: '剑如秋水' } : {}),
    },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}
