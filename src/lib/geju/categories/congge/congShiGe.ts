import { readBazi, readExtras, readShishen } from '../../hooks'
import { SHI_SHEN_CAT, type GejuHit } from '../../types'
import { emitGeju } from '../../_emit'

/**
 * 弃命从势 — 严格依《滴天髓·从象》任铁樵注:
 *   1. 日主无根 — 天干无比印, 地支本气/中气/余气皆无比劫/印 (任一藏即破)
 *   2. 财 / 官杀 / 食伤 三者中 ≥ 2 种强势并立 (透干 + 通根)
 *   3. 顺流通关 — 食伤→财 或 财→官杀 至少一链
 *   4. 无印 (透或藏)              — 已并入条件 1
 *   5. 无比劫 (透或藏)            — 已并入条件 1
 *
 *  【岁运】岁运透比劫 / 印 → Break (复根破从)。
 */
export function isCongShiGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()

  // —— 条件 1 + 4 + 5: 日主完全无根 (无比印任一位置) ——
  if (shishen.touCat('比劫')) return null
  if (shishen.touCat('印')) return null
  // 全 4 柱所有藏干 (本/中/余气) 皆不得为 比劫 / 印
  const allHide = bazi.mainArr.flatMap((p) => p.hideShishen as string[])
  if (allHide.some((s) => SHI_SHEN_CAT[s] === '比劫')) return null
  if (allHide.some((s) => SHI_SHEN_CAT[s] === '印')) return null

  // —— 条件 2: 三党中 ≥ 2 种强势 (透干 + 地支通根) ——
  const strongCai = shishen.touCat('财') && (shishen.zang('正财') || shishen.zang('偏财'))
  const strongGS = shishen.touCat('官杀') && (shishen.zang('正官') || shishen.zang('七杀'))
  const strongSS = shishen.touCat('食伤') && (shishen.zang('食神') || shishen.zang('伤官'))
  const strongN = (strongCai ? 1 : 0) + (strongGS ? 1 : 0) + (strongSS ? 1 : 0)
  if (strongN < 2) return null

  // —— 条件 3: 顺流通关 — 食伤→财 或 财→官杀 至少一链 ——
  const linkSC = strongSS && strongCai
  const linkCG = strongCai && strongGS
  if (!linkSC && !linkCG) return null

  // 岁运透 比劫 / 印 → Break
  const baseFormed = true
  const withExtrasFormed = !extras.touCat('比劫') && !extras.touCat('印')

  const tags = [
    strongSS ? '食伤' : '',
    strongCai ? '财' : '',
    strongGS ? '官杀' : '',
  ].filter(Boolean)
  return emitGeju(
    {
      name: '弃命从势',
      note: `日主无根 · 无比印 · ${tags.join('+')} 强势并立${linkSC ? ' · 食伤生财' : ''}${linkCG ? ' · 财生官杀' : ''}`,
    },
    { baseFormed, withExtrasFormed, hasExtras: extras.active },
  )
}
