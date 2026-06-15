import { readBazi, readExtras } from '../../hooks'
import type { GejuHit } from '../../types'
import { emitGeju } from '../../_emit'
import { checkZhuanWang } from './_check'

/**
 * 润下格 — 壬癸水日主专旺。
 *
 * bazi-skills 6 条 (《渊海子平·润下格》《穷通宝鉴·壬水章》《滴天髓·从象》):
 *  1. 日主为壬 或 癸水                                       [静态]
 *  2. 地支会成水局 — 申子辰三合 OR 亥子丑三会               [可被岁运补]
 *  3. 天干多透水 — 日主外另透壬/癸 ≥ 1 位                   [可被岁运补]
 *  4. 无戊己土透干克水                                        [岁运透土 → Break]
 *  5. 无重火蒸水 — 丙丁不多透                                [岁运透火 → Break, md 微火反喜未实现]
 *  6. (助力) 金生 / 木泄 → "金白水清" / "水木清华"          [可被岁运补 → 升格]
 *
 *  本 detector: 1 静态；2/3/4/5 由 _check 处理；6 通过本文件 hasMu / hasJin 计算。
 *  emitGeju 装配 显/隐/Break。
 */
export function isRunXiaGe(): GejuHit | null {
  const bazi = readBazi()
  const extras = readExtras()
  const r = checkZhuanWang('水')
  if (!r) return null

  const baseMuN = bazi.ganWxCount('木') + bazi.zhiMainWxCount('木')
  const baseJinN = bazi.ganWxCount('金') + bazi.zhiMainWxCount('金')
  const extraMuAdd = extras.extraGanWxCount('木') + extras.extraZhiMainWxCount('木')
  const extraJinAdd = extras.extraGanWxCount('金') + extras.extraZhiMainWxCount('金')
  const hasMu = baseMuN > 0 || extraMuAdd > 0
  const hasJin = baseJinN > 0 || extraJinAdd > 0
  const hasExtra = hasMu || hasJin

  const tags: string[] = []
  if (baseMuN > 0) tags.push(`木泄秀 ${baseMuN} 位`)
  else if (extraMuAdd > 0) tags.push(`岁运木泄秀 ${extraMuAdd} 位`)
  if (baseJinN > 0) tags.push(`金生水 ${baseJinN} 位`)
  else if (extraJinAdd > 0) tags.push(`岁运金生水 ${extraJinAdd} 位`)

  return emitGeju(
    {
      name: '润下格',
      note: `${r.note}${hasExtra ? ` · ${tags.join(' / ')}` : ''}`,
      ...(hasExtra ? { guigeVariant: '润下清华' } : {}),
    },
    { baseFormed: r.baseFormed, withExtrasFormed: r.withExtrasFormed, hasExtras: r.hasExtras },
  )
}
