import { readBazi, readShishen, readExtras } from '../../hooks'
import { CHONG_PAIR, EMPTY_SUIYUN, deriveVisibility } from '../../types'
import type { GejuHit } from '../../types'

/**
 * 日贵格（依《三命通会·论日贵》6 条必要 + 1 条岁运加重）：
 *  1. 日柱为丁亥/丁酉/癸巳/癸卯。
 *  2. 有官星（**收紧**:必要,需透干)。
 *  3. 官星不被冲。
 *  4. 有财生官（非必要，加品）。
 *  5. 日支贵人不被**局内**冲/合去。
 *  6. 贵人/财官不在空亡位 (ctx 无空亡 API，TODO)。
 *
 * 【岁运】md 条件 7 加重:大运 / 流年 冲 / 合去 / 害 日支贵人 → 凶。
 *  当前实现:挂 suiyunSpecific=true + suiyunDefaultTrigger=true (默认成格);
 *  extras 含 dzChong / dzHai / heZhi 任一时挂 suiyunConquer (岁运冲害)。
 */
const RI_GUI = new Set(['丁亥', '丁酉', '癸巳', '癸卯'])
const HE_OF_RIGUI: Record<string, string> = {
  亥: '寅', 酉: '辰', 巳: '申', 卯: '戌',
}
const HAI_PAIR: Record<string, string> = {
  亥: '申', 酉: '戌', 巳: '寅', 卯: '辰',
}

export function isRiGuiGe(): GejuHit | null {
  const bazi = readBazi()
  const shishen = readShishen()
  const extras = readExtras()
  if (!RI_GUI.has(bazi.dayGz)) return null
  const { year, month, hour } = bazi.pillars
  const otherZhis: string[] = [year.zhi, month.zhi, hour.zhi]
  // md 条件 5: 贵人日支不被局内冲
  const dzChong = CHONG_PAIR[bazi.dayZhi as string]
  if (dzChong && otherZhis.includes(dzChong)) return null
  // md 条件 2 (收紧: 改必要): 官星必须**透干** (不能只藏)
  if (!shishen.touCat('官杀')) return null
  // md 条件 5 副: 贵人带合（加固，不破格）
  const heZhi = HE_OF_RIGUI[bazi.dayZhi as string]
  const hasHe = heZhi && otherZhis.includes(heZhi)
  // md 条件 7: 大运/流年 冲 / 合去 / 害 日支贵人 → 岁运冲害
  const dzHai = HAI_PAIR[bazi.dayZhi as string]
  const extraZhis = extras.extraArr.map((p) => p.zhi as string)
  const conquer =
    (!!dzChong && extraZhis.includes(dzChong)) ||
    (!!dzHai && extraZhis.includes(dzHai)) ||
    (!!heZhi && extraZhis.includes(heZhi))
  const 岁运 = {
    ...EMPTY_SUIYUN,
    isSuiyun: true,
    DefaultTrigger: true,
    Conquer: conquer,
  }
  return {
    name: '日贵格',
    note: `日柱 ${bazi.dayGz} · 贵人不冲${hasHe ? '·带合牢固' : ''}${conquer ? '·岁运冲害' : ''}`,
    岁运,
    显隐: deriveVisibility(岁运),
  }
}
