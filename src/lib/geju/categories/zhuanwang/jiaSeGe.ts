import { readBazi } from '../../hooks'
import { readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { checkZhuanWang } from './_check'

/**
 * 稼穑格 — 戊己土日主专旺。
 *
 * bazi-skills 6 条 (《渊海子平·稼穑格》《三命通会·稼穑》《滴天髓·从象》):
 *  1. 日主为戊 或 己土                                     [静态]
 *  2. 月令为土 — 辰、戌、丑、未之一                        [静态]
 *  3. 地支土气遍布 — 四库俱全 OR 至少 3 位土               [可被岁运补]
 *  4. 无甲乙木透干克土                                      [岁运透木 → Break]
 *  5. 无重水冲土                                            [岁运透水 → Break]
 *  6. (助力) 金点缀泄秀 → "稼穑毓秀" 复合贵格              [可被岁运补 → 升格]
 *
 *  本 detector: 1/2 静态守卫；3/4/5/6 通过 _check + 升格判定 (主局 OR 岁运金) 处理；
 *  emitGeju 将 baseFormed / withExtrasFormed 装配为显/隐/Break。
 */
export function isJiaSeGe(): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()
  if (bazi.dayWx !== '土') return null
  if (!['辰', '戌', '丑', '未'].includes(bazi.monthZhi)) return null
  const r = checkZhuanWang('土', 1)
  if (!r) return null

  // 升格 "稼穑毓秀" — 金点缀 (主局 OR 岁运)
  const baseJinN = bazi.ganWxCount('金') + bazi.zhiMainWxCount('金')
  const extraJinAdd = extras.extraGanWxCount('金') + extras.extraZhiMainWxCount('金')
  const hasJin = baseJinN > 0 || extraJinAdd > 0
  const variantNote = baseJinN > 0
    ? ` · 金点缀 ${baseJinN} 位`
    : extraJinAdd > 0
      ? ` · 岁运金点缀 ${extraJinAdd} 位`
      : ''

  return emitGeju(
    {
      name: '稼穑格',
      note: `月令 ${bazi.monthZhi} ; ${r.note}${variantNote}`,
      ...(hasJin ? { guigeVariant: '稼穑毓秀' } : {}),
    },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}
